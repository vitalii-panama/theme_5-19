import re

# Get the raw data string from the input.
rawData = input_data['lineitem_data']

# --- Improved Parsing Logic for Keyed Data ---

# Define the keys we want to extract from the order data
keys = [
    "Finish",
    "Approximate Size",
    "Registration Number", 
    "Font Style",
    "Text Color",
    "Outline Color",
    "Outline Size"
]

# The final list of parsed items that Zapier will loop through.
line_items = []

# Split by double newlines to separate multiple items (if any)
items = [item.strip() for item in re.split(r'\n\s*\n', rawData) if item.strip()]

for item in items:
    item_dict = {}
    for key in keys:
        # Use regex to find the value after each key
        # This handles keys with colons and extracts the value on the next line
        pattern = rf"{re.escape(key)}:\s*(.*?)(?=\n[A-Za-z]|\n\n|$)"
        match = re.search(pattern, item, re.DOTALL)
        if match:
            # Clean up the extracted value
            value = match.group(1).strip()
            item_dict[key] = value
    
    # Only add items that have at least some data
    if item_dict:
        line_items.append(item_dict)

# --- ZAPIER OUTPUT ---
# Return the list of dictionaries. Zapier will now be able to loop through
# each item and you can map the fields using the clear key names defined above.
return line_items
