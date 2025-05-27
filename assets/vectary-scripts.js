import { VctrModelApi } from "https://www.vectary.com/studio-lite/scripts/api.js";
// Helper function to get color properties from the UI
function getColorProperties() {
  // Try to get color values from the DOM
  try {
    // Find all color displays to extract current colors
    const colorProperties = {};

    // Direct selectors for color swatches
    const colorDisplays = {
      C5: document.getElementById("colorDisplayC5"),
      C4: document.getElementById("colorDisplayC4"),
      C3: document.getElementById("colorDisplayC3"),
      C2: document.getElementById("colorDisplayC2"),
      C1: document.getElementById("colorDisplayC1"),
      BG: document.getElementById("colorDisplayBG"),
    };

    const colorNames = {
      C5: document.getElementById("colorNameC5"),
      C4: document.getElementById("colorNameC4"),
      C3: document.getElementById("colorNameC3"),
      C2: document.getElementById("colorNameC2"),
      C1: document.getElementById("colorNameC1"),
      BG: document.getElementById("colorNameBG"),
    };

    Object.keys(colorDisplays).forEach((key) => {
      const display = colorDisplays[key];
      const nameElement = colorNames[key];

      if (display && nameElement) {
        const bgColor = window.getComputedStyle(display).backgroundColor;
        const colorName = nameElement.textContent;

        // Convert rgb to hex if needed
        function rgbToHex(rgb) {
          if (rgb.startsWith("#")) return rgb;

          // Parse RGB values
          const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
          if (rgbMatch) {
            const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, "0");
            const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, "0");
            const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, "0");
            return `#${r}${g}${b}`;
          }
          return rgb;
        }

        const hexColor = rgbToHex(bgColor);

        // Format the key and value in a standardized way
        const propertyKey = `Color_${key.replace(/[^a-zA-Z0-9]/g, "")}`;
        const propertyValue = `${colorName} (${hexColor})`;

        // Add to properties object
        colorProperties[propertyKey] = propertyValue;
      }
    });

    return colorProperties;
  } catch (error) {
    console.error("Error getting color properties:", error);
    return {};
  }
}
// --- Color Swatches Data ---
const color_swatches_data = {};
const rawColorData =
  "Apricot Crush#fead77Arctic Cat Green#b8f63bArctic Cat Orange / KTM / Polaris Burst#d75d18Arctic Cat Purple#69488eArctic Tan / Desert Tan#b5a588Army Green#5b6236Blaze Orange#dc4410Can-Am Dark Grey#323232Can-Am Gold#b2945eCan-Am Maverick Grey#797c81Can-Am Sea-Doo Blue#008bceCan-Am Silver#bbbab9Can-Am Yellow#e4a612Carribean Blue#0082baCatalyst Dark Grey#88898cCatalyst Grey#c8caccCatGrey#c8caccCharcoal Grey#434244Chile Peper Red#772935Coastal Grey#75787bCyan#00acecD.S Pink#ed008cDayglow#ddfc4aDazzaling Blue#043bffDefender Grey#777677Dusty Navy#1b365dEclipise Grey#4e4b48Gris Silex#b1b3b3Gris Silex#b1b3b3Gulfstream Blue#007dbaHonda Red / LYNX Red#cc2229Hybrid White#d9d9d6Iceberg Blue#00778bLabrador Blue#183165Lava Dark Red#c61f15Light Blue#aee6ffLiquid Titanium#7d725bLYNX Cyan#17a4ccLYNX Titanium#a39d88LYNX Titanium2#b3ae9bM.O.T Red#de2d32Manta Green#ddf84aMidnight Purple#291844Millennium Yellow#ffc41dNeo Mint#99ccccNeo Yellow#dbe442Nuclear Yellow#dee829Octane Blue#0091daOrange Crush#ff9d00Orange Phoenix#d8752dOrange Phoenix2#d6692eOxford Blue#005297Panama Turquoise#004f59Platinum Silver#75726ePolaris Glow#b4875ePolaris Lime Squeeze#dae343Quetzal Green#00b176R.B Motorsports Blue#2d396bR.B. Pink#c2214dRacing Green#004631RB Yellow#f5d230Red Orange#ff0000Reef Blue#2db1bdRhodamine#e10098Scandi Blue#567a9bSCS W Blue Black#1a1e25Sea-Doo Belize Blue#006298Sea-Doo Dark Blue#007dbaSea-Doo Magenta#ce0076Ski-doo#fdee00Ski-Doo Dark Blue#2a385dSki-Doo Dark Orange#ff6d00Ski-Doo Gold#a49764Spartan Red#8e2631Sport Grey#716e6aSteel Grey#6a6c70Sunburst Yellow - Ski-doo / Sea-Doo / Can-Am#fcf73aTeal M#0091b3Timeless Black#2e2c26True Black#000000True Red / Polaris Red#da0002Turquoise#00c7d1Unlimited Lava / Can-Am Red / Trixx Red#d63205Vapor Blue#a5b0e3vapor blue#a5b0e3Vintage Arctic Cat Green#5bc500Vintage Manta Green#c0df16Vintage Polaris Dark Blue#162667Vintage Ski-Doo Yellow#f5d130Violet#440099White#ffffffYahmaha BLue#0b0daeBlack#000000";

function parseColorData(rawData) {
  const colorsArray = [];
  const pairs = rawData.match(/[^#]+#[0-9a-fA-F]{6}/g) || [];
  pairs.forEach((pair) => {
    const parts = pair.split("#");
    if (parts.length >= 2) {
      const hex = `#${parts.pop()}`;
      const name = parts.join("#");
      if (hex.match(/^#[0-9a-fA-F]{6}$/)) {
        colorsArray.push({ name: name.trim(), hex: hex });
      } else {
        console.warn(`Skipping invalid entry: ${pair}`);
      }
    } else {
      console.warn(`Skipping malformed entry: ${pair}`);
    }
  });
  if (colorsArray.length === 0) {
    console.error("Failed to parse color data, using default fallback.");
    return [{ name: "Default White", hex: "#ffffff" }];
  }
  return colorsArray;
}

const structuredColors = parseColorData(rawColorData);
const numColors = structuredColors.length;

for (let i = 1; i <= 100; i++) {
  const colorIndex = (i - 1) % numColors;
  color_swatches_data[`A${i}`] = structuredColors[colorIndex].name; // Assign name to 'A' key
  color_swatches_data[`B${i}`] = structuredColors[colorIndex].hex; // Assign hex to 'B' key
}

// Product data (Not used for logic anymore, but kept for reference/prices)
const products = [
  { level: 1, name: "Ski-Doo Gen5 Level 1", price: "$349.95", url: "#" },
  { level: 2, name: "Ski-Doo Gen5 Level 2", price: "$75.00", url: "#" },
  { level: 3, name: "Ski-Doo Gen5 Level 3", price: "$75.00", url: "#" },
  { level: 4, name: "Ski-Doo Gen5 Level 4", price: "$75.00", url: "#" },
];

const selectedColor = document.querySelector(
  '[data-handle="color"] [data-variant-input]:checked'
);
const selectedColorValue = selectedColor ? selectedColor.value : null;
const selectedColorIndex = selectedColor
  ? Array.from(
      document.querySelectorAll('[data-handle="color"] [data-variant-input]')
    ).indexOf(selectedColor)
  : 0;

// State management
const state = {
  // *** REMOVED selectedLevels ***
  activePreset: selectedColorIndex + 1 || 1,
  lockedMaterials: {
    C5: false,
    C4: false,
    C3: false,
    C2: false,
    C1: false,
    BG: false,
  },
  colorValues: {
    C5: 1,
    C4: 20,
    C3: 40,
    C2: 60,
    C1: 80,
    BG: 12,
  },
  activeLevels: new Set(), // Add a Set to track active levels
  activeOverlaminates: new Set(), // Add a Set to track active overlaminates
};

// Make state accessible to other scripts
window.state = state;

// Make function available globally for other event handlers
window.addMultipleProductsToCart = function (
  productIds,
  colorProperties
) {
  console.log("Adding multiple products to cart:", productIds);

  // Prepare items array for cart update
  const items = productIds.map(p => ({
    id: parseInt(p.id),
    quantity: 1,
    properties: {}
  }));
  
  // Add main product with color properties if it exists
  if (window.mainProduct) {
    items.push({
      id: parseInt(window.mainProduct.id),
      quantity: 1,
      properties: colorProperties
    });
  }

  let formData = {
    'items': items
  };

  fetch(window.Shopify.routes.root + 'cart/add.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(response => {
    return response.json();
  })
  .then(data => {
    console.log("All products added to cart", data);
    window.location.href = "/cart";
  })
  .catch((error) => {
    console.error("Error adding products to cart:", error);
    alert(
      "There was an error adding the products to your cart. Please try again."
    );
  });
};

// Also make addToCartWithColorProperties globally available
window.addToCartWithColorProperties = function (
  variant_id,
  quantity,
  colorProperties
) {
  // Prepare the line item data
  const data = {
    id: variant_id,
    quantity: quantity,
    properties: colorProperties,
  };

  // Add to cart using the Cart API
  fetch("/cart/add.js", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((item) => {
      console.log("Product added to cart with color properties:", item);
      // Redirect to checkout
      window.location.href = "/checkout";
    })
    .catch((error) => {
      console.error("Error adding product to cart:", error);
      alert(
        "There was an error adding this product to the cart. Please try again."
      );
    });
};

// --- Main Application Logic ---
// Wrap in DOMContentLoaded to ensure iframe exists
document.addEventListener("DOMContentLoaded", () => {
  // *** Declare API instance variable in this scope ***
  let modelApi = null;
  let isApiReady = false;
  const statusMessage = document.getElementById("status-message");

  // *** Define sliderConfigs here, before it's needed ***
  const sliderConfigs = [
    {
      sliderId: "swatchSliderC5",
      displayId: "colorDisplayC5",
      nameId: "colorNameC5",
      lockId: "lockC5",
      objects: [
        "color-less-5",
        "wrapkit-partial 5",
        "wrapkit-full 5",
        "wrapkit-premium 5",
      ],
      material: "MAT-GLOSS-C5",
    },
    {
      sliderId: "swatchSliderC4",
      displayId: "colorDisplayC4",
      nameId: "colorNameC4",
      lockId: "lockC4",
      objects: ["wrapkit-partial 4", "wrapkit-full 4"],
      material: "MAT-GLOSS-C4",
    },
    {
      sliderId: "swatchSliderC3",
      displayId: "colorDisplayC3",
      nameId: "colorNameC3",
      lockId: "lockC3",
      objects: ["wrapkit-partial 3", "wrapkit-full 3"],
      material: "MAT-GLOSS-C3",
    },
    {
      sliderId: "swatchSliderC2",
      displayId: "colorDisplayC2",
      nameId: "colorNameC2",
      lockId: "lockC2",
      objects: ["wrapkit-partial 2", "wrapkit-full 2"],
      material: "MAT-GLOSS-C2",
    },
    {
      sliderId: "swatchSliderC1",
      displayId: "colorDisplayC1",
      nameId: "colorNameC1",
      lockId: "lockC1",
      objects: ["wrapkit-partial 1", "wrapkit-full 1"],
      material: "MAT-GLOSS-C1",
    },
    {
      sliderId: "swatchSliderBG",
      displayId: "colorDisplayBG",
      nameId: "colorNameBG",
      lockId: "lockBG",
      objects: ["background_object"],
      material: "MAT-GLOSS-BG",
  ];

  // --- Define ALL functions first ---
  const hexToRbg = (hex) => {
    const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
    if (cleanHex.length !== 6) {
      console.warn(`Invalid hex color: ${hex}. Using white.`);
      return [255, 255, 255];
    }
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return [r, g, b];
  };

  function updateMaterialColor(
    api,
    sliderElement,
    displayElement,
    nameElement,
    objectNames,
    materialName
  ) {
    if (!sliderElement || !displayElement || !nameElement) {
      console.error(
        `Slider, display, or name element not found for ${materialName}.`
      );
      return;
    }
    if (!isApiReady || !api || typeof api.addOrEditMaterial !== "function") {
      console.warn(
        `API not ready or addOrEditMaterial missing for ${materialName}. Cannot update material color.`
      );
      return;
    }
    if (typeof color_swatches_data === "undefined") {
      console.error("The `color_swatches_data` object is not defined.");
      return;
    }

    const sliderValue = parseInt(sliderElement.value, 10);
    const keyA = `A${sliderValue}`;
    const keyB = `B${sliderValue}`;
    const hexColor = color_swatches_data.hasOwnProperty(keyB)
      ? color_swatches_data[keyB]
      : "#FFFFFF";
    const colorName = color_swatches_data.hasOwnProperty(keyA)
      ? color_swatches_data[keyA]
      : "Unknown";

    displayElement.style.backgroundColor = hexColor;
    nameElement.textContent = colorName;
    const materialId = materialName.replace("MAT-GLOSS-", "");
    state.colorValues[materialId] = sliderValue;
    const rgb = hexToRbg(hexColor);

    objectNames.forEach((objectName) => {
      api
        .addOrEditMaterial(objectName, {
          name: materialName,
          baseColor: { color: { x: rgb[0], y: rgb[1], z: rgb[2] } },
        })
        .catch((error) => {
          /* Avoid logging errors for hidden objects */
        });
    });
  }

  function initializeSliderUI() {
    sliderConfigs.forEach((config) => {
      const sliderElement = document.getElementById(config.sliderId);
      const displayElement = document.getElementById(config.displayId);
      const nameElement = document.getElementById(config.nameId);
      const lockElement = document.getElementById(config.lockId);
      const materialId = config.material.replace("MAT-GLOSS-", "");

      if (sliderElement && displayElement && nameElement && lockElement) {
        sliderElement.value = state.colorValues[materialId] || 50;
        const updateSliderDisplay = () => {
          const sliderValue = parseInt(sliderElement.value, 10);
          const keyA = `A${sliderValue}`;
          const keyB = `B${sliderValue}`;
          const hexColor = color_swatches_data.hasOwnProperty(keyB)
            ? color_swatches_data[keyB]
            : "#FFFFFF";
          const colorName = color_swatches_data.hasOwnProperty(keyA)
            ? color_swatches_data[keyA]
            : "Unknown";
          displayElement.style.backgroundColor = hexColor;
          nameElement.textContent = colorName;
          state.colorValues[materialId] = sliderValue;
        };
        updateSliderDisplay(); // Initial UI update

        lockElement.addEventListener("click", function () {
          state.lockedMaterials[materialId] =
            !state.lockedMaterials[materialId];
          this.classList.toggle("locked", state.lockedMaterials[materialId]);
        });
      } else {
        console.warn(`HTML elements not found for slider config:`, config);
      }
    });
  }

  function initializeSlidersWithAPI(api) {
    sliderConfigs.forEach((config) => {
      const sliderElement = document.getElementById(config.sliderId);
      const displayElement = document.getElementById(config.displayId);
      const nameElement = document.getElementById(config.nameId);
      const lockElement = document.getElementById(config.lockId); // Needed for listener
      const materialId = config.material.replace("MAT-GLOSS-", "");

      if (sliderElement && displayElement && nameElement && lockElement) {
        // Add input listener that calls API
        sliderElement.addEventListener("input", function () {
          if (!state.lockedMaterials[materialId]) {
            // Update UI first (already done by initializeSliderUI listener)
            // Then update Vectary material
            updateMaterialColor(
              api,
              this,
              displayElement,
              nameElement,
              config.objects,
              config.material
            );
            if (state.activePreset !== null) {
              state.activePreset = null;
              updatePresetButtons();
            }
          }
        });
        // Trigger initial material update
        updateMaterialColor(
          api,
          sliderElement,
          displayElement,
          nameElement,
          config.objects,
          config.material
        );
      }
    });
  }

  function waitForApiMethod(
    apiInstance,
    methodName,
    maxRetries = 50,
    interval = 100
  ) {
    return new Promise((resolve, reject) => {
      let retries = 0;
      const checkInterval = setInterval(() => {
        if (apiInstance && typeof apiInstance[methodName] === "function") {
          clearInterval(checkInterval);
          console.log(`API method '${methodName}' is available.`);
          resolve();
        } else {
          retries++;
          console.log(
            `Waiting for API method '${methodName}'... (Attempt ${retries})`
          );
          if (retries >= maxRetries) {
            clearInterval(checkInterval);
            reject(
              new Error(
                `API method '${methodName}' did not become available after ${
                  maxRetries * interval
                }ms.`
              )
            );
          }
        }
      }, interval);
    });
  }

  function triggerInitialEvents(api) {
    if (!isApiReady || !api) {
      console.warn("Cannot trigger initial events: API not ready or null.");
      return;
    }
    console.log("Attempting to trigger initial events...");

    // Trigger initial preset event (default)
    if (state.activePreset) {
      const eventName = `color-${state.activePreset}-btn`;
      console.log(`Triggering initial preset event: ${eventName}`);
      applyPreset(api, state.activePreset, true);
    }
  }

  function setupEventListeners(api) {
    console.log("Setting up event listeners...");
    setupLevelButtons(api);
    setupOverlaminateButtons(api);
    setupPresetButtons(api);
    document
      .getElementById("randomizeButton")
      ?.addEventListener("click", () => randomizeColors(api));
    document
      .getElementById("checkout-button")
      ?.addEventListener("click", () => {
        alert("Checkout functionality not implemented in this example.");
      });
    document
      .getElementById("saveConfigButton")
      ?.addEventListener("click", saveConfiguration);

    // Add event listener for the selected levels checkout button
    document
      .getElementById("selectedLevelsCheckout")
      ?.addEventListener("click", () => {
        if (state.activeLevels.size > 0) {
          // Get all product IDs for the selected levels
          const productIds = Array.from(state.activeLevels)
            .map((level) => window.globalProductData[level])
            .filter((id) => id); // Remove any undefined IDs

          // Get all product IDs for the selected overlaminates
          const overlaminateIds = Array.from(state.activeOverlaminates)
            .map((type) => window.overlaminateProductData[type])
            .filter((id) => id); // Remove any undefined IDs

          // Combine both arrays
          const allProductIds = [...productIds, ...overlaminateIds];

          if (allProductIds.length > 0) {
            const colorProperties = getColorProperties();
            console.log(
              "Adding selected products to cart from checkout button:",
              allProductIds
            );
            window.addMultipleProductsToCart(allProductIds, colorProperties);
          }
        }
      });

    console.log("Event listeners setup complete.");
  }

  function disableControls() {
    document
      .querySelectorAll(".controls-panel button, .controls-panel input")
      .forEach((el) => {
        el.disabled = true;
      });
    console.warn("Controls disabled.");
  }

  function randomizeColors(api) {
    let updated = false;
    sliderConfigs.forEach((config) => {
      const materialId = config.material.replace("MAT-GLOSS-", "");
      if (!state.lockedMaterials[materialId]) {
        const sliderElement = document.getElementById(config.sliderId);
        const displayElement = document.getElementById(config.displayId);
        const nameElement = document.getElementById(config.nameId);

        if (sliderElement && displayElement && nameElement) {
          const randomValue = Math.floor(Math.random() * 100) + 1;
          sliderElement.value = randomValue;
          // Update UI via state change (handled by initializeSliderUI listener)
          const updateSliderDisplay = () => {
            const sliderValue = parseInt(sliderElement.value, 10);
            const keyA = `A${sliderValue}`;
            const keyB = `B${sliderValue}`;
            const hexColor = color_swatches_data.hasOwnProperty(keyB)
              ? color_swatches_data[keyB]
              : "#FFFFFF";
            const colorName = color_swatches_data.hasOwnProperty(keyA)
              ? color_swatches_data[keyA]
              : "Unknown";
            displayElement.style.backgroundColor = hexColor;
            nameElement.textContent = colorName;
            state.colorValues[materialId] = sliderValue;
          };
          updateSliderDisplay();
          // Update Vectary material
          updateMaterialColor(
            api,
            sliderElement,
            displayElement,
            nameElement,
            config.objects,
            config.material
          );
          updated = true;
        }
      }
    });

    if (updated) {
      state.activePreset = null;
      updatePresetButtons();
      statusMessage.textContent = "Colors randomized";
      console.log("Randomizing colors...");
      if (isApiReady && api && typeof api.dispatchEvent === "function") {
        api.dispatchEvent("randomize-btn");
        console.log("Event 'randomize-btn' dispatched.");
      } else {
        console.warn(
          "Vectary API not ready or dispatchEvent missing, cannot dispatch randomize event."
        );
      }

      // Update Selected Options Display
      if (typeof window.updateSelectedOptionsDisplay === "function") {
        window.updateSelectedOptionsDisplay(color_swatches_data, state);
      }
    }
  }

  function applyPreset(api, presetNumber, forceEvent = false) {
    const presets = {
      1: { C5: 55, C4: 34, C3: 72, C2: 91, C1: 12, BG: 93 },
      2: { C5: 23, C4: 45, C3: 67, C2: 89, C1: 11, BG: 56 },
      3: { C5: 78, C4: 32, C3: 17, C2: 42, C1: 99, BG: 33 },
      4: { C5: 5, C4: 10, C3: 15, C2: 20, C1: 25, BG: 30 },
      5: { C5: 50, C4: 52, C3: 54, C2: 56, C1: 58, BG: 60 },
      6: { C5: 88, C4: 77, C3: 66, C2: 55, C1: 44, BG: 33 },
    };

    if (presets[presetNumber]) {
      let colorsApplied = false;
      if (!forceEvent || state.activePreset !== presetNumber) {
        sliderConfigs.forEach((config) => {
          const materialId = config.material.replace("MAT-GLOSS-", "");
          if (
            !state.lockedMaterials[materialId] &&
            presets[presetNumber][materialId] !== undefined
          ) {
            const sliderElement = document.getElementById(config.sliderId);
            const displayElement = document.getElementById(config.displayId);
            const nameElement = document.getElementById(config.nameId);
            if (sliderElement && displayElement && nameElement) {
              const presetValue = presets[presetNumber][materialId];
              if (parseInt(sliderElement.value) !== presetValue) {
                sliderElement.value = presetValue;
                // Update UI via state change (handled by initializeSliderUI listener)
                const updateSliderDisplay = () => {
                  const sliderValue = parseInt(sliderElement.value, 10);
                  const keyA = `A${sliderValue}`;
                  const keyB = `B${sliderValue}`;
                  const hexColor = color_swatches_data.hasOwnProperty(keyB)
                    ? color_swatches_data[keyB]
                    : "#FFFFFF";
                  const colorName = color_swatches_data.hasOwnProperty(keyA)
                    ? color_swatches_data[keyA]
                    : "Unknown";
                  displayElement.style.backgroundColor = hexColor;
                  nameElement.textContent = colorName;
                  state.colorValues[materialId] = sliderValue;
                };
                updateSliderDisplay();
                // Update Vectary material
                updateMaterialColor(
                  api,
                  sliderElement,
                  displayElement,
                  nameElement,
                  config.objects,
                  config.material
                );
                colorsApplied = true;
              }
            }
          }
        });
      }

      if (state.activePreset !== presetNumber || colorsApplied || forceEvent) {
        state.activePreset = presetNumber;
        updatePresetButtons();
        if (isApiReady && api && typeof api.dispatchEvent === "function") {
          const eventName = `color-${presetNumber}-btn`;
          api.dispatchEvent(eventName);
        } else {
          console.warn(
            `Vectary API not ready or dispatchEvent missing, cannot dispatch event color-${presetNumber}-btn.`
          );
        }

        // Update Selected Options Display
        if (typeof window.updateSelectedOptionsDisplay === "function") {
          window.updateSelectedOptionsDisplay(color_swatches_data, state);
        }
      }
    }
  }

  function setupPresetButtons(api) {
    const presetGrid = document.querySelector(".preset-grid");
    if (!presetGrid) return;
    presetGrid.addEventListener("click", (event) => {
      if (event.target.matches(".preset-button")) {
        const buttonId = event.target.id;
        const presetNumber = parseInt(buttonId.split("-")[1]);
        if (!isNaN(presetNumber)) {
          applyPreset(api, presetNumber);
        }
      }
    });
    updatePresetButtons();
  }

  function updatePresetButtons() {
    document.querySelectorAll(".preset-button").forEach((button, index) => {
      const presetNumber = index + 1;
      const isActive = state.activePreset === presetNumber;
      button.classList.toggle("active", isActive);
      let indicator = button.querySelector(".active-indicator");
      if (isActive && !indicator) {
        indicator = document.createElement("span");
        indicator.className = "active-indicator";
        indicator.textContent = "✓";
        button.appendChild(indicator);
      } else if (!isActive && indicator) {
        button.removeChild(indicator);
      }
    });
  }

  function setupLevelButtons(api) {
    const levelGrid = document.querySelector(".level-grid");
    if (!levelGrid) return;
    levelGrid.addEventListener("click", (event) => {
      const button = event.target.closest(".level-button");
      if (button) {
        const levelId = button.id;
        const level = parseInt(levelId.replace("triggerButtonLevel", ""));
        if (!isNaN(level)) {
          triggerLevelEvent(api, level);

          // Toggle active class on the button
          button.classList.toggle("active");

          // Update activeLevels in state
          if (state.activeLevels.has(level)) {
            state.activeLevels.delete(level);
          } else {
            state.activeLevels.add(level);
          }

          // Update selected levels counter
          updateSelectedLevelsCounter();
        }
      }
    });

    // Set initial active states if needed
    updateLevelButtonsActiveState();

    // Initialize selected levels counter
    updateSelectedLevelsCounter();
  }

  // Function to update the selected levels counter
  function updateSelectedLevelsCounter() {
    const countElement = document.getElementById("selectedLevelsCount");
    const checkoutButton = document.getElementById("selectedLevelsCheckout");

    if (countElement) {
      countElement.textContent = state.activeLevels.size;
    }

    if (checkoutButton) {
      checkoutButton.disabled = state.activeLevels.size === 0;
    }
  }

  function updateLevelButtonsActiveState() {
    // Update all level buttons to match state.activeLevels
    document.querySelectorAll(".level-button").forEach((button) => {
      const levelId = button.id;
      const level = parseInt(levelId.replace("triggerButtonLevel", ""));
      if (!isNaN(level)) {
        button.classList.toggle("active", state.activeLevels.has(level));
      }
    });

    // Update selected levels counter
    updateSelectedLevelsCounter();
  }

  function triggerLevelEvent(api, level) {
    if (isApiReady && api && typeof api.dispatchEvent === "function") {
      const eventName = `level-${level}-btn`;
      api.dispatchEvent(eventName);

      // Toggle the visibility of the level item in the selected options display
      const levelItem = document.querySelector(
        `.level-item[data-level="${level}"]`
      );
      if (levelItem) {
        // Check current visibility and toggle it
        const isVisible = levelItem.style.display !== "none";
        levelItem.style.display = isVisible ? "none" : "flex";
      }
    } else {
      console.warn(
        `Vectary API not ready or dispatchEvent missing, cannot dispatch event level-${level}-btn.`
      );
      statusMessage.textContent = `Error: API not ready.`;
    }
  }

  function setupOverlaminateButtons(api) {
    const overlaminateGrid = document.querySelector(".overlaminate-grid");
    if (!overlaminateGrid) return;
    
    overlaminateGrid.addEventListener("click", (event) => {
      const button = event.target.closest(".overlaminate-button");
      if (button) {
        const overlaminateHandle = button.getAttribute("data-overlaminate-handle");
        if (overlaminateHandle) {
          const isCurrentlyActive = state.activeOverlaminates.has(overlaminateHandle);
          
          // Clear all active classes first
          document.querySelectorAll(".overlaminate-button").forEach(btn => {
            btn.classList.remove("active");
          });
          
          // Clear all active overlaminates
          state.activeOverlaminates.clear();
          
          // Only add the new selection if it wasn't already active
          if (!isCurrentlyActive) {
            // Add active class to the clicked button
            button.classList.add("active");
            
            // Add to activeOverlaminates in state
            state.activeOverlaminates.add(overlaminateHandle);
            
            // Trigger Vectary event if API is ready
            if (isApiReady && api && typeof api.dispatchEvent === "function") {
              const eventName = `overlaminate-${overlaminateHandle}`;
              api.dispatchEvent(eventName);
            } else {
              console.warn(
                `Vectary API not ready or dispatchEvent missing, cannot dispatch event ${eventName}.`
              );
            }
          }

          // Update selected options display if available
          if (typeof window.updateSelectedOptionsDisplay === "function") {
            window.updateSelectedOptionsDisplay(color_swatches_data, state);
          }
        }
      }
    });

    // Set initial active states
    updateOverlaminateButtonsActiveState();
  }

  // Function to update the overlaminate buttons active state
  function updateOverlaminateButtonsActiveState() {
    // Update all overlaminate buttons to match state.activeOverlaminates
    document.querySelector(".overlaminate-button").click()
  }

  function saveConfiguration() {
    const configData = {
      activePreset: state.activePreset,
      colorValues: state.colorValues,
      lockedMaterials: state.lockedMaterials,
      activeLevels: Array.from(state.activeLevels), // Convert Set to Array for JSON serialization
      activeOverlaminates: Array.from(state.activeOverlaminates), // Add overlaminates to saved config
    };
    const configBlob = new Blob([JSON.stringify(configData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(configBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ski-doo-configuration.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    statusMessage.textContent = "Configuration saved successfully";
  }

  // --- Initial UI Setup Calls ---
  updatePresetButtons();
  initializeSliderUI(); // Setup slider UI without API calls

  // --- Initialize Vectary API ---
  (async () => {
    try {
      console.log("Attempting to initialize Vectary API...");
      const apiInstance = new VctrModelApi("VECTARY_EMBED_ID");
      await apiInstance.init();
      modelApi = apiInstance; // Assign to outer scope variable
      console.log("Vectary API initialized successfully (via init).");

      // Polling check for dispatchEvent method
      await waitForApiMethod(modelApi, "dispatchEvent", 50, 100);

      isApiReady = true; // Set ready flag

      // Re-Initialize Sliders with API connection
      initializeSlidersWithAPI(modelApi); // Changed name for clarity

      // Setup Event Listeners
      setupEventListeners(modelApi);

      // Initialize Selected Options Display
      if (typeof window.initSelectedOptionsDisplay === "function") {
        window.initSelectedOptionsDisplay(products, color_swatches_data, state);
      }

      // Add listeners for color changes to update selected options display
      sliderConfigs.forEach((config) => {
        const sliderElement = document.getElementById(config.sliderId);
        if (sliderElement) {
          sliderElement.addEventListener("input", function () {
            if (typeof window.updateSelectedOptionsDisplay === "function") {
              window.updateSelectedOptionsDisplay(color_swatches_data, state);
            }
          });
        }
      });

      // Listen for selected-options events
      document.addEventListener(
        "selected-options-remove-level",
        function (event) {
          const level = event.detail.level;
          if (level && typeof triggerLevelEvent === "function") {
            triggerLevelEvent(modelApi, level);
          }
        }
      );

      // Listen for selected-options events
      document.addEventListener("selected-options-checkout", function (event) {
        // Retrieve color properties from the event if available
        const colorProperties =
          event.detail && event.detail.colorProperties
            ? event.detail.colorProperties
            : {};

        console.log(
          "Proceeding to checkout with color properties:",
          colorProperties
        );

        // Get all selected level products from state.activeLevels
        if (state.activeLevels.size > 0) {
          // Get all product IDs for the selected levels
          const productIds = Array.from(state.activeLevels)
            .map((level) => window.globalProductData[level])
            .filter((id) => id); // Remove any undefined IDs

          if (productIds.length > 0) {
            console.log("Adding selected level products to cart:", productIds);
            window.addMultipleProductsToCart(productIds, colorProperties);
            return; // Skip the rest of the function since we're handling it in addMultipleProductsToCart
          }
        }

        // Fallback to original behavior if no levels are selected
        // Check if we have variant information and add to cart
        // Look for variant info in the page, common in Shopify product pages
        const variantIdInput = document.querySelector(
          'input[name="id"], select[name="id"]'
        );
        if (variantIdInput && variantIdInput.value) {
          const variantId = variantIdInput.value;
          // Add to cart with properties and proceed to checkout
          window.addToCartWithColorProperties(variantId, 1, colorProperties);
        } else {
          // Just save the color properties as cart attributes and proceed to checkout
          fetch("/cart/update.js", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ attributes: colorProperties }),
          })
            .then((response) => response.json())
            .then((cart) => {
              console.log(
                "Cart updated with color properties as attributes:",
                cart
              );
              window.location.href = "/checkout";
            })
            .catch((error) => {
              console.error("Error updating cart:", error);
              alert("There was an error updating the cart. Please try again.");
            });
        }
      });

      // Trigger initial events
      triggerInitialEvents(modelApi);
    } catch (error) {
      console.error("Error initializing or verifying Vectary API:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else {
        console.error("Caught non-Error object:", error);
      }
      statusMessage.textContent = "Error initializing 3D model. Check console.";
      disableControls();
    }
  })(); // End of async IIFE for initialization
}); // End of DOMContentLoaded listener

const levelButtons = document.querySelectorAll(".level-button");
const coverageButtons = document.querySelectorAll(
  '[data-handle="coverage"] [data-variant-input]'
);
const presetButtons = document.querySelectorAll(".preset-button");
const variantButtons = document.querySelectorAll(
  '[data-handle="color"] [data-variant-input]'
);

document.addEventListener("DOMContentLoaded", () => {
  presetButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      variantButtons[index].click();
    });
  });

  variantButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      presetButtons[index].click();
    });
  });

  // Updated event handling for level buttons - don't just click coverage buttons
  // Instead, toggle the active state and update state.activeLevels
  levelButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      // Don't automatically click coverageButtons to allow independent selection
      // Just make sure the UI reflects the state correctly
      // This is handled in setupLevelButtons now
    });
  });

  // Update coverage buttons to work with multi-selection
  coverageButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      const levelButton = levelButtons[index];
      if (levelButton) {
        levelButton.classList.toggle("active", button.checked);

        // Update state.activeLevels
        const level = parseInt(
          levelButton.id.replace("triggerButtonLevel", "")
        );
        if (!isNaN(level)) {
          if (button.checked) {
            window.state.activeLevels.add(level);
          } else {
            window.state.activeLevels.delete(level);
          }
        }
      }
    });
  });

  // Set initial button states
  variantButtons.forEach((button, index) => {
    if (button.checked) {
      presetButtons[index].click();
    }
  });

  // Set initial level button states based on coverage buttons
  coverageButtons.forEach((button, index) => {
    // if (button.checked) {
      const levelButton = levelButtons[index];
      if (levelButton) {
        levelButton.classList.add("active");
        const level = parseInt(
          levelButton.id.replace("triggerButtonLevel", "")
        );
        if (!isNaN(level)) {
          window.state.activeLevels.add(level);
        }
      }
    // }
  });
});
// Wait for the page to load
document.addEventListener("DOMContentLoaded", function () {
  // Access state from vectary embed context
  // This relies on the state variable being accessible in the page scope

  // Find all Add to Cart forms on the page and add submission handler
  const addToCartForms = document.querySelectorAll('form[action="/cart/add"]');

  addToCartForms.forEach((form) => {
    form.addEventListener("submit", function (event) {
      // Prevent default form submission
      event.preventDefault();

      // Get color properties
      const colorProperties = getColorProperties();

      // Check if we have active levels or overlaminates to add to cart
      if (
        window.state &&
        (window.state.activeLevels.size > 0 || window.state.activeOverlaminates.size > 0)
      ) {
        // Get product IDs for all selected levels
        const productIds = Array.from(window.state.activeLevels)
          .map((level) => window.globalProductData[level])
          .filter((id) => id); // Remove any undefined IDs

        // Get product IDs for all selected overlaminates
        const overlaminateIds = Array.from(window.state.activeOverlaminates)
          .map((type) => window.overlaminateProductData[type])
          .filter((id) => id); // Remove any undefined IDs

        // Combine both arrays
        const allProductIds = [...productIds, ...overlaminateIds];

        if (allProductIds.length > 0) {
          console.log(
            "Adding selected products to cart from form submit:",
            allProductIds
          );
          window.addMultipleProductsToCart(allProductIds, colorProperties);
          return;
        }
      }

      // If no levels are selected, continue with original behavior
      if (Object.keys(colorProperties).length > 0) {
        // Remove any existing color property inputs
        const existingPropertyInputs = form.querySelectorAll(
          'input[name^="properties[Color_"]'
        );
        existingPropertyInputs.forEach((input) => input.remove());

        // Add property inputs to the form
        Object.keys(colorProperties).forEach((key) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = `properties[${key}]`;
          input.value = colorProperties[key];
          form.appendChild(input);
        });

        console.log("Adding to cart with color properties:", colorProperties);
      }

      // Submit the form
      form.submit();
    });
  });

  // Handle direct "Add to Cart" button clicks that might use AJAX
  const addToCartButtons = document.querySelectorAll(
    ".addtocart_button, [data-add-to-cart]"
  );

  addToCartButtons.forEach((button) => {
    // Store original click handler by cloning the node
    const newButton = button.cloneNode(true);

    // Replace with our intercepted version
    button.parentNode.replaceChild(newButton, button);

    // Add our click handler
    newButton.addEventListener("click", function (event) {
      const parentForm = this.closest("form");
      // Check if we have active levels or overlaminates to add to cart
      if (
        !parentForm &&
        window.state &&
        (window.state.activeLevels.size > 0 || window.state.activeOverlaminates.size > 0)
      ) {
        // This is for direct button clicks without forms
        event.preventDefault();

        // Get color properties
        const colorProperties = getColorProperties();

        // Get product IDs for all selected levels
        const productIds = Array.from(window.state.activeLevels)
          .map((level) => window.globalProductData[level])
          .filter((id) => id); // Remove any undefined IDs

        // Get product IDs for all selected overlaminates
        const overlaminateIds = Array.from(window.state.activeOverlaminates)
          .map((type) => window.overlaminateProductData[type])
          .filter((id) => id); // Remove any undefined IDs

        // Combine both arrays
        const allProductIds = [...productIds, ...overlaminateIds];

        if (allProductIds.length > 0) {
          console.log(
            "Adding selected products to cart from button click:",
            allProductIds
          );
          window.addMultipleProductsToCart(allProductIds, colorProperties);
          return;
        }
      }

      // If the button is not inside a form, it likely uses AJAX
      if (!parentForm) {
        // This is for AJAX add to cart
        const colorProperties = getColorProperties();

        // Store the properties in sessionStorage to be used by AJAX handlers
        if (Object.keys(colorProperties).length > 0) {
          sessionStorage.setItem(
            "vectaryColorProperties",
            JSON.stringify(colorProperties)
          );
          console.log(
            "Stored color properties for AJAX add to cart:",
            colorProperties
          );
        }
      }
      // Form submission is handled by the form submit event handler
    });
  });

  // Set initial overlaminate button states
  // Default to selecting the first overlaminate option
  // const firstOverlaminateButton = document.querySelector(".overlaminate-button");
  // if (firstOverlaminateButton) {
  //   const handle = firstOverlaminateButton.getAttribute("data-overlaminate-handle");
  //   if (handle && window.state) {
  //     window.state.activeOverlaminates.add(handle);
  //     firstOverlaminateButton.classList.add("active");
  //   }
  // }

  // Intercept AJAX cart additions by monkeypatching fetch and XMLHttpRequest
  const originalFetch = window.fetch;
  window.fetch = function () {
    const url = arguments[0];

    // Check if this is an add to cart request
    if (url && (url.includes("/cart/add") || url === "/cart/add.js")) {
      try {
        const colorProperties = JSON.parse(
          sessionStorage.getItem("vectaryColorProperties") || "{}"
        );

        if (Object.keys(colorProperties).length > 0) {
          // Clone the request
          const newArgs = [...arguments];

          if (newArgs[1] && newArgs[1].body) {
            let body;

            // Handle FormData
            if (newArgs[1].body instanceof FormData) {
              body = newArgs[1].body;
              // Add properties to FormData
              Object.keys(colorProperties).forEach((key) => {
                body.append(`properties[${key}]`, colorProperties[key]);
              });
              newArgs[1].body = body;
            }
            // Handle JSON
            else if (typeof newArgs[1].body === "string") {
              try {
                body = JSON.parse(newArgs[1].body);
                if (!body.properties) body.properties = {};

                // Add color properties
                Object.keys(colorProperties).forEach((key) => {
                  body.properties[key] = colorProperties[key];
                });

                newArgs[1].body = JSON.stringify(body);
              } catch (e) {
                console.error("Error parsing fetch body:", e);
              }
            }
          }

          console.log(
            "Intercepted AJAX cart add with color properties:",
            colorProperties
          );
          // Clear stored properties after use
          sessionStorage.removeItem("vectaryColorProperties");

          return originalFetch.apply(this, newArgs);
        }
      } catch (e) {
        console.error("Error intercepting fetch:", e);
      }
    }

    return originalFetch.apply(this, arguments);
  };
});
