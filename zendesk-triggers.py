from datetime import datetime, timedelta, timezone
import os
import sys
import json
from pathlib import Path
import time
import signal
import requests

# Ensure stdout can print Unicode (emojis) without crashing
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# Embedded credentials (fallbacks used if no env/config present)
EMBEDDED_CREDENTIALS = {
    "subdomain": "scsunlimited",
    "email": "tyler@scsunlimited.com",
    "api_token": "SmEppe9iWUrZfkzKV2b0hQvtSyKiyPpou1wo00dB",
}


# Simple .env loader (no external deps)
def _load_dotenv(paths):
    for p in paths:
        try:
            with open(p, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    if k and v and k not in os.environ:
                        os.environ[k] = v
        except FileNotFoundError:
            continue

def _load_json_config(paths):
    for p in paths:
        try:
            with open(p, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Only set if not already present in env
                for k, v in {
                    "ZENDESK_SUBDOMAIN": data.get("subdomain"),
                    "ZENDESK_EMAIL": data.get("email"),
                    "ZENDESK_API_TOKEN": data.get("api_token"),
                }.items():
                    if v and k not in os.environ:
                        os.environ[k] = str(v)
                return True
        except FileNotFoundError:
            continue
        except Exception:
            continue
    return False

def _bootstrap_credentials():
    # Try .env in project dir and home
    here = Path(__file__).resolve().parent
    home = Path.home()
    _load_dotenv([here / ".env", home / ".env", here / "zendesk.env"])

    # Try JSON configs
    _load_json_config([
        here / "zendesk.config.json",
        home / ".config" / "zendesk" / "config.json",
    ])

    subdomain = os.getenv("ZENDESK_SUBDOMAIN", "").strip()
    email = os.getenv("ZENDESK_EMAIL", "").strip()
    token = os.getenv("ZENDESK_API_TOKEN", "").strip()

    # Fallback to embedded credentials if env/config are not provided
    if not subdomain:
        subdomain = EMBEDDED_CREDENTIALS.get("subdomain", "").strip()
    if not email:
        email = EMBEDDED_CREDENTIALS.get("email", "").strip()
    if not token:
        token = EMBEDDED_CREDENTIALS.get("api_token", "").strip()
    return subdomain, email, token


def _normalize_subdomain(s: str) -> str:
    """Accepts values like 'scsunlimited', 'scsunlimited.zendesk.com', or a full URL.
    Returns plain subdomain 'scsunlimited'."""
    if not s:
        return s
    s = s.strip().lower()
    if s.startswith("https://"):
        s = s[len("https://"):]
    if s.startswith("http://"):
        s = s[len("http://"):]
    # Trim path if any
    s = s.split("/", 1)[0]
    # Remove trailing .zendesk.com if present
    if s.endswith(".zendesk.com"):
        s = s[: -len(".zendesk.com")]
    return s


def utcnow():
    return datetime.now(timezone.utc)


def to_iso_z(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_iso_to_aware(ts: str) -> datetime:
    # Supports "...Z" and offsets
    if not ts:
        return utcnow()
    if ts.endswith("Z"):
        ts = ts.replace("Z", "+00:00")
    return datetime.fromisoformat(ts).astimezone(timezone.utc)


class ZendeskAPI:
    def __init__(self):
        # Load credentials automatically (no interactive input required)
        subdomain, email, token = _bootstrap_credentials()
        subdomain = _normalize_subdomain(subdomain)
        if not (subdomain and email and token):
            print("❌ Missing Zendesk credentials and no embedded defaults provided.")
            print("   Update EMBEDDED_CREDENTIALS at the top of this file or set env/.env.")
            sys.exit(1)

        self.subdomain = subdomain
        self.email = email
        self.token = token
        self.base_url = f'https://{self.subdomain}.zendesk.com/api/v2'
        self.auth = (f'{self.email}/token', self.token)
        self.headers = {'Content-Type': 'application/json'}

        # Reusable HTTP session
        self.session = requests.Session()
        self.session.headers.update(self.headers)

        # New monitoring attributes
        self.last_check_time = None
        self.known_ticket_ids = set()
        self.monitoring_active = False
        self.total_new_tickets = 0
        self.start_time = None
        # Update monitoring attributes
        self.last_update_check_time = None
        self.known_ticket_updates = {}
        self.total_updated_tickets = 0

    # ------------- Core utilities -------------

    def make_request(self, method: str, endpoint: str, params=None, data=None, timeout=30):
        url = f"{self.base_url}/{endpoint}"
        retries = 3
        backoff = 2

        for attempt in range(1, retries + 1):
            try:
                if method == "GET":
                    resp = self.session.get(url, auth=self.auth, headers=self.headers, params=params, timeout=timeout)
                elif method == "POST":
                    resp = self.session.post(url, auth=self.auth, headers=self.headers, json=data, timeout=timeout)
                elif method == "PUT":
                    resp = self.session.put(url, auth=self.auth, headers=self.headers, json=data, timeout=timeout)
                elif method == "DELETE":
                    resp = self.session.delete(url, auth=self.auth, headers=self.headers, timeout=timeout)
                else:
                    print(f"❌ Unsupported HTTP method: {method}")
                    return None

                if resp.status_code == 429:
                    # Rate limited
                    retry_after = int(resp.headers.get("Retry-After", "3"))
                    time.sleep(retry_after)
                    continue

                return resp
            except requests.RequestException as e:
                if attempt == retries:
                    print(f"❌ Network error: {e}")
                    return None
                time.sleep(backoff ** attempt)

        return None

    def save_to_file(self, data, filename: str) -> bool:
        try:
            with open(filename, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            print(f"💾 Saved to {filename}")
            return True
        except Exception as e:
            print(f"❌ Error saving file: {e}")
            return False

    # ------------- Ticket fetching -------------

    def get_recent_tickets_since(self, since_time: datetime | None = None, limit: int = 50):
        # If since_time provided, use search API; else, fetch recent tickets
        if since_time:
            since_str = to_iso_z(since_time)
            params = {
                "query": f"type:ticket created>{since_str}",
                "per_page": limit,
                "sort_by": "created_at",
                "sort_order": "desc",
            }
            resp = self.make_request("GET", "search.json", params=params)
            if resp and resp.status_code == 200:
                return resp.json().get("results", [])
            return []
        else:
            params = {"per_page": limit, "sort_by": "created_at", "sort_order": "desc"}
            resp = self.make_request("GET", "tickets.json", params=params)
            if resp and resp.status_code == 200:
                return resp.json().get("tickets", [])
            return []

    def get_recently_updated_tickets(self, since_time: datetime | None = None, limit: int = 50):
        # Try search API; fallback to recent tickets filtered locally
        if since_time:
            since_str = to_iso_z(since_time)
            params = {
                "query": f"type:ticket updated>{since_str}",
                "per_page": limit,
                "sort_by": "updated_at",
                "sort_order": "desc",
            }
            resp = self.make_request("GET", "search.json", params=params)
            if resp and resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    return results

            # Fallback: fetch recent and filter
            params = {"per_page": min(limit * 2, 100), "sort_by": "updated_at", "sort_order": "desc"}
            resp = self.make_request("GET", "tickets.json", params=params)
            if resp and resp.status_code == 200:
                tickets = resp.json().get("tickets", [])
                filtered = []
                base = since_time if since_time.tzinfo else since_time.replace(tzinfo=timezone.utc)
                for t in tickets:
                    try:
                        if parse_iso_to_aware(t.get("updated_at", "")) > base:
                            filtered.append(t)
                    except Exception:
                        continue
                return filtered
            return []
        else:
            params = {"per_page": limit, "sort_by": "updated_at", "sort_order": "desc"}
            resp = self.make_request("GET", "tickets.json", params=params)
            if resp and resp.status_code == 200:
                return resp.json().get("tickets", [])
            return []

    def get_ticket_comments(self, ticket_id: int, limit: int = 100):
        resp = self.make_request("GET", f"tickets/{ticket_id}/comments.json")
        if resp and resp.status_code == 200:
            comments = resp.json().get("comments", [])
            return comments[-limit:] if limit and len(comments) > limit else comments
        return []

    # ------------- New ticket monitor -------------

    def check_for_new_tickets(self):
        now = utcnow()
        if self.last_check_time is None:
            # Baseline
            tickets = self.get_recent_tickets_since(limit=50)
            self.known_ticket_ids = {t["id"] for t in tickets if "id" in t}
            self.last_check_time = now
            print(f"✅ Monitoring initialized with {len(self.known_ticket_ids)} known tickets")
            return []
        else:
            tickets = self.get_recent_tickets_since(self.last_check_time, limit=100)
            new_tickets = [t for t in tickets if t.get("id") not in self.known_ticket_ids]
            for t in new_tickets:
                tid = t.get("id")
                if tid is not None:
                    self.known_ticket_ids.add(tid)
            self.last_check_time = now
            self.total_new_tickets += len(new_tickets)
            return new_tickets

    def display_new_tickets(self, new_tickets):
        if not new_tickets:
            return
        print("\n" + "🔥" * 10 + " NEW TICKETS " + "🔥" * 10)
        for i, t in enumerate(new_tickets, 1):
            tid = t.get("id", "Unknown")
            subj = t.get("subject", "(No subject)")
            status = (t.get("status") or "unknown").upper()
            priority = (t.get("priority") or "unknown").upper()
            requester = t.get("requester_id", "Unknown")
            created = t.get("created_at", "Unknown")
            print(f"\n📩 NEW TICKET #{i}")
            print(f"   🆔 ID: {tid}")
            print(f"   📝 Subject: {subj}")
            print(f"   📊 Status: {status}")
            print(f"   ⚡ Priority: {priority}")
            print(f"   👤 Requester: {requester}")
            print(f"   🕒 Created: {created}")

    # ------------- Update monitor -------------

    def check_for_ticket_updates(self):
        now = utcnow()
        if self.last_update_check_time is None:
            # Baseline
            print("🔄 Initializing ticket update monitor...")
            tickets = self.get_recently_updated_tickets(limit=50)
            self.known_ticket_updates = {}
            for t in tickets:
                try:
                    updated_at = parse_iso_to_aware(t.get("updated_at", ""))
                    self.known_ticket_updates[t["id"]] = {
                        "updated_at": updated_at,
                        "status": t.get("status"),
                        "priority": t.get("priority"),
                        "assignee_id": t.get("assignee_id"),
                        "last_comment_count": len(self.get_ticket_comments(t["id"], limit=100)),
                    }
                except Exception:
                    continue
            self.last_update_check_time = now
            self.total_updated_tickets = 0
            print(f"✅ Update monitoring initialized with {len(self.known_ticket_updates)} tickets")
            return []
        else:
            tickets = self.get_recently_updated_tickets(self.last_update_check_time, limit=100)
            updated = []

            for t in tickets:
                try:
                    tid = t["id"]
                    updated_at = parse_iso_to_aware(t.get("updated_at", ""))
                    current_status = t.get("status")
                    current_priority = t.get("priority")
                    current_assignee = t.get("assignee_id")
                    comments = self.get_ticket_comments(tid, limit=100)
                    comment_count = len(comments)

                    is_updated = False
                    reasons = []

                    prev = self.known_ticket_updates.get(tid)
                    if not prev:
                        is_updated = True
                        reasons.append("New ticket detected")
                    else:
                        if updated_at > prev["updated_at"]:
                            is_updated = True
                            reasons.append("Timestamp changed")
                        if current_status != prev["status"]:
                            is_updated = True
                            reasons.append(f"Status: {prev['status']} → {current_status}")
                        if current_priority != prev["priority"]:
                            is_updated = True
                            reasons.append(f"Priority: {prev['priority']} → {current_priority}")
                        if current_assignee != prev["assignee_id"]:
                            is_updated = True
                            reasons.append(f"Assignee: {prev['assignee_id']} → {current_assignee}")
                        if comment_count > prev["last_comment_count"]:
                            is_updated = True
                            reasons.append(f"New comments: +{comment_count - prev['last_comment_count']}")

                    if is_updated:
                        t["recent_comments"] = comments[-2:] if len(comments) >= 2 else comments
                        t["update_reasons"] = reasons
                        updated.append(t)

                        self.known_ticket_updates[tid] = {
                            "updated_at": updated_at,
                            "status": current_status,
                            "priority": current_priority,
                            "assignee_id": current_assignee,
                            "last_comment_count": comment_count,
                        }
                except Exception:
                    continue

            self.last_update_check_time = now
            self.total_updated_tickets += len(updated)
            return updated

    # ------------- Display helpers -------------

    def display_status_header(self):
        now = datetime.now()
        uptime = now - self.start_time if self.start_time else timedelta(0)
        print(f"\n🎯 NEW TICKET MONITOR | {now.strftime('%H:%M:%S')} | ⏱️ {str(uptime).split('.')[0]} | 🎫 Total: {self.total_new_tickets} | 📊 Tracking: {len(self.known_ticket_ids)}")

    def display_update_status_header(self):
        now = datetime.now()
        uptime = now - self.start_time if self.start_time else timedelta(0)
        print(f"\n🔄 UPDATE MONITOR | {now.strftime('%H:%M:%S')} | ⏱️ {str(uptime).split('.')[0]} | 🔄 Updates: {self.total_updated_tickets} | 📊 Tracking: {len(self.known_ticket_updates)}")

    # ------------- Monitoring loops -------------

    def _countdown(self, seconds: int, label: str, clear_width: int = 56):
        print(f"\n{label} ", end="", flush=True)
        for remaining in range(seconds, 0, -1):
            print(f"\r{label} {remaining:2d} seconds... ", end="", flush=True)
            time.sleep(1)
        print("\r" + " " * clear_width + "\r", end="", flush=True)

    def start_monitoring(self, interval=30, show_status=True):
        self.monitoring_active = True
        self.start_time = datetime.now()

        print(f"🚀 Starting ticket monitor (every {interval}s)")
        print("💡 Ctrl+C to stop")
        # Initial check (no countdown before this)
        if show_status:
            self.display_status_header()

        # First run
        new_tickets = self.check_for_new_tickets()
        if new_tickets:
            self.display_new_tickets(new_tickets)
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            self.save_to_file(new_tickets, f"new_tickets_{ts}.json")
        else:
            print("✅ Initialization complete - No new tickets found")

        # Graceful stop with SIGINT
        def on_sigint(sig, frame):
            print("\n\n🛑 Monitoring stopped by user")
            self.monitoring_active = False
            sys.exit(0)

        signal.signal(signal.SIGINT, on_sigint)

        try:
            while self.monitoring_active:
                # Countdown before next check
                if show_status:
                    self._countdown(interval, "⏱️  Next check in:")
                else:
                    time.sleep(interval)

                if show_status:
                    self.display_status_header()

                new_tickets = self.check_for_new_tickets()
                if new_tickets:
                    self.display_new_tickets(new_tickets)
                    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                    self.save_to_file(new_tickets, f"new_tickets_{ts}.json")
                else:
                    print("✅ No new tickets found")
        finally:
            self.monitoring_active = False

    def start_update_monitoring(self, interval=15, show_status=True):
        self.monitoring_active = True
        self.start_time = datetime.now()

        print(f"🚀 Starting ticket update monitor (every {interval}s)")
        print("💡 Ctrl+C to stop")
        # Initial check (no countdown before this)
        if show_status:
            self.display_update_status_header()

        # First run
        updated_tickets = self.check_for_ticket_updates()
        if updated_tickets:
            self.display_updated_tickets(updated_tickets)
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            self.save_to_file(updated_tickets, f"updated_tickets_{ts}.json")
        else:
            print("✅ Initialization complete - No updates found")

        # Graceful stop with SIGINT
        def on_sigint(sig, frame):
            print("\n\n🛑 Update monitoring stopped by user")
            self.monitoring_active = False
            sys.exit(0)

        signal.signal(signal.SIGINT, on_sigint)

        try:
            while self.monitoring_active:
                # Countdown before next check
                if show_status:
                    self._countdown(interval, "⏱️  Next update check in:")
                else:
                    time.sleep(interval)

                if show_status:
                    self.display_update_status_header()

                updated_tickets = self.check_for_ticket_updates()
                if updated_tickets:
                    self.display_updated_tickets(updated_tickets)
                    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                    self.save_to_file(updated_tickets, f"updated_tickets_{ts}.json")
                else:
                    print("✅ No ticket updates found")
        finally:
            self.monitoring_active = False

    # ------------- Update ticket display -------------

    def display_updated_tickets(self, updated_tickets):
        if not updated_tickets:
            return

        print("\n" + "🔄" * 10 + " TICKET UPDATES " + "🔄" * 10)
        for i, t in enumerate(updated_tickets, 1):
            tid = t.get("id", "Unknown")
            subj = t.get("subject", "(No subject)")
            status = (t.get("status") or "unknown").upper()
            priority = (t.get("priority") or "unknown").upper()
            assignee = t.get("assignee_id") or "Unassigned"
            updated_at = t.get("updated_at", "Unknown")

            print(f"\n🔄 UPDATED TICKET #{i}")
            print(f"   🆔 ID: {tid}")
            print(f"   📝 Subject: {subj}")
            print(f"   📊 Status: {status}")
            print(f"   ⚡ Priority: {priority}")
            print(f"   👤 Assignee: {assignee}")
            print(f"   🕒 Updated: {updated_at}")

            reasons = t.get("update_reasons") or []
            if reasons:
                print("   🔍 Changes:")
                for r in reasons:
                    print(f"      • {r}")

            comments = t.get("recent_comments") or []
            if comments:
                print(f"   💬 Last {min(2, len(comments))} Comments:")
                for j, c in enumerate(comments[-2:], 1):
                    author_id = c.get("author_id", "Unknown")
                    body = (c.get("body") or "").strip()
                    if len(body) > 150:
                        body = body[:150] + "..."
                    created = c.get("created_at", "Unknown")
                    print(f"      {j}. Author: {author_id} | {created}")
                    print(f"         {body}")

    # ------------- Menus -------------

    def monitor_menu(self):
        while True:
            print("\n" + "=" * 60)
            print("📡 NEW TICKET MONITOR")
            print("=" * 60)
            print("1. 🔥 Start (30s)")
            print("2. ⚡ Quick (10s)")
            print("3. 🐌 Slow (60s)")
            print("4. 📊 Custom interval")
            print("5. 🔍 One-time check")
            print("0. ⬅️  Back")
            print("=" * 60)
            choice = input("\nSelect: ").strip()
            if choice == "0":
                break
            elif choice == "1":
                self.start_monitoring(interval=30, show_status=True)
            elif choice == "2":
                self.start_monitoring(interval=10, show_status=True)
            elif choice == "3":
                self.start_monitoring(interval=60, show_status=True)
            elif choice == "4":
                try:
                    interval = int(input("Seconds (min 5): ").strip())
                    if interval < 5:
                        print("❌ Minimum is 5 seconds")
                        continue
                    self.start_monitoring(interval=interval, show_status=True)
                except ValueError:
                    print("❌ Invalid number")
            elif choice == "5":
                new_tickets = self.check_for_new_tickets()
                if new_tickets:
                    self.display_new_tickets(new_tickets)
                else:
                    print("✅ No new tickets")
            else:
                print("❌ Invalid option")

    def update_monitor_menu(self):
        while True:
            print("\n" + "=" * 60)
            print("🔄 TICKET UPDATE MONITOR")
            print("=" * 60)
            print("1. 🔥 Start (15s)")
            print("2. ⚡ Quick (10s)")
            print("3. 🐌 Slow (30s)")
            print("4. 📊 Custom interval")
            print("5. 🔍 One-time check")
            print("0. ⬅️  Back")
            print("=" * 60)
            choice = input("\nSelect: ").strip()
            if choice == "0":
                break
            elif choice == "1":
                self.start_update_monitoring(interval=15, show_status=True)
            elif choice == "2":
                self.start_update_monitoring(interval=10, show_status=True)
            elif choice == "3":
                self.start_update_monitoring(interval=30, show_status=True)
            elif choice == "4":
                try:
                    interval = int(input("Seconds (min 5): ").strip())
                    if interval < 5:
                        print("❌ Minimum is 5 seconds")
                        continue
                    self.start_update_monitoring(interval=interval, show_status=True)
                except ValueError:
                    print("❌ Invalid number")
            elif choice == "5":
                updated = self.check_for_ticket_updates()
                if updated:
                    self.display_updated_tickets(updated)
                else:
                    print("✅ No ticket updates")
            else:
                print("❌ Invalid option")

    # ------------- Utilities -------------

    def reset_update_tracking(self):
        self.known_ticket_updates.clear()
        self.last_update_check_time = None
        self.total_updated_tickets = 0
        print("✅ Update tracking reset")

    def reset_new_ticket_tracking(self):
        self.known_ticket_ids.clear()
        self.last_check_time = None
        self.total_new_tickets = 0
        print("✅ New ticket tracking reset")


# ------------- Top-level menus -------------

def show_menu():
    print("\n" + "=" * 60)
    print("🎯 ZENDESK API MANAGER")
    print("=" * 60)
    print("1. 📡 New Ticket Monitor")
    print("2. 🔄 Ticket Update Monitor")
    print("0. ❌ Exit")
    print("=" * 60)


def main():
    api = ZendeskAPI()
    while True:
        show_menu()
        choice = input("\nSelect an option (0-2): ").strip()
        if choice == "0":
            print("👋 Goodbye!")
            break
        elif choice == "1":
            api.monitor_menu()
        elif choice == "2":
            api.update_monitor_menu()
        else:
            print("❌ Invalid option")


if __name__ == "__main__":
    main()