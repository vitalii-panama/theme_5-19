# Metafields Setup for Vectary Controls

This document explains how to set up the metafields required for the `vectary-controls.liquid` file to work properly.

## Overview

The `vectary-controls.liquid` file has been updated to use Shopify metafields instead of hardcoded product handles. This makes the product references configurable through the Shopify admin interface.

## Required Metafields

### Sea-Doo Spark24 Product Type

For products with type `Sea-Doo Spark24`, you need to set up these metafields:

1. **sea_doo_spark24_level1_product** - Product reference for Level 1
2. **sea_doo_spark24_level2_product** - Product reference for Level 2
3. **sea_doo_spark24_level3_product** - Product reference for Level 3
4. **sea_doo_spark24_level4_product** - Product reference for Level 4
5. **sea_doo_spark24_level5_product** - Product reference for Level 5

### Sea-Doo Switch Product Type

For products with type `Sea-Doo Switch`, you need to set up these metafields:

1. **sea_doo_switch_level1_product** - Product reference for Level 1
2. **sea_doo_switch_level2_product** - Product reference for Level 2
3. **sea_doo_switch_level3_product** - Product reference for Level 3

### Ski-Doo Gen5 Product Type (Default)

For all other product types, you need to set up these metafields:

1. **ski_doo_gen5_level1_product** - Product reference for Level 1
2. **ski_doo_gen5_level2_product** - Product reference for Level 2
3. **ski_doo_gen5_level3_product** - Product reference for Level 3
4. **ski_doo_gen5_level4_product** - Product reference for Level 4

### Overlaminate Options (All Product Types)

These metafields are used for all product types:

1. **overlaminate_metallic_silver_product** - Metallic Silver overlaminate product
2. **overlaminate_metallic_gold_product** - Metallic Gold overlaminate product
3. **overlaminate_matte_product** - Matte overlaminate product
4. **overlaminate_standard_gloss_product** - Standard Gloss overlaminate product
5. **overlaminate_chrome_gloss_product** - Chrome Gloss overlaminate product
6. **overlaminate_chrome_matte_product** - Chrome Matte overlaminate product
7. **overlaminate_holographic_gloss_product** - Holographic Gloss overlaminate product
8. **overlaminate_holographic_matte_product** - Holographic Matte overlaminate product

## How to Set Up Metafields in Shopify Admin

### Method 1: Using the Shopify Admin Interface

1. Go to **Settings** > **Custom data** > **Metafields**
2. Click **Add definition**
3. For each metafield:
   - **Name**: Use the metafield name from the list above
   - **Namespace and key**: Use `custom` as the namespace and the metafield name as the key
   - **Type**: Select **Product reference**
   - **Description**: Add a descriptive name (e.g., "Level 1 product for Sea-Doo Spark24")
   - **Target**: Select **Product**
   - **Access**: Choose **Merchants and apps**

### Method 2: Using the Shopify CLI (Recommended for Development)

You can also set up metafields using the Shopify CLI with a metafields definition file:

```json
{
	"metafields": [
		{
			"namespace": "custom",
			"key": "sea_doo_spark24_level1_product",
			"name": "Sea-Doo Spark24 Level 1 Product",
			"type": "product_reference",
			"description": "Product reference for Sea-Doo Spark24 Level 1",
			"target": "product"
		},
		{
			"namespace": "custom",
			"key": "sea_doo_spark24_level2_product",
			"name": "Sea-Doo Spark24 Level 2 Product",
			"type": "product_reference",
			"description": "Product reference for Sea-Doo Spark24 Level 2",
			"target": "product"
		}
		// ... continue for all metafields
	]
}
```

## How to Assign Products to Metafields

1. Go to the product page in your Shopify admin
2. Scroll down to the **Metafields** section
3. For each metafield, click the product selector and choose the appropriate product
4. Save the product

## Benefits of Using Metafields

1. **Flexibility**: Product references can be changed without editing code
2. **Maintainability**: No need to update template files when product handles change
3. **User-friendly**: Non-technical users can manage product associations
4. **Scalability**: Easy to add new products or change existing ones
5. **Version Control**: Template changes are separate from product configuration

## Fallback Behavior

If a metafield is not set for a particular product, the corresponding button will not be displayed. This allows for flexible configuration where not all products need all levels or overlaminate options.

## Testing

After setting up the metafields:

1. Visit a product page that uses the vectary controls
2. Verify that the level buttons appear correctly
3. Check that the overlaminate options are displayed
4. Test that the product data is correctly passed to the JavaScript

## Troubleshooting

- **Buttons not appearing**: Check that the metafields are properly assigned to the product
- **Wrong products showing**: Verify that the correct products are selected in the metafields
- **JavaScript errors**: Ensure that the product handles in the metafields are valid
- **Missing prices**: Confirm that the referenced products have valid prices set
