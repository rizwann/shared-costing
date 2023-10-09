# Store Routes API Documentation

These are the API endpoints for managing stores.

## Base URL

`/stores`

## Create a New Store

Create a new store with image upload.

- **URL:** `/create`
- **Method:** `POST`
- **Request Body:**
- `name` (string, required): The name of the store.
- `image` (file): An optional image of the store.
- **Example Request Body:**

  ```json
  {
    "name": "SuperMart"
  }`

  ```

- Response:

  - Status Code: 201 (Created)
  - Body:

    `{
  "message": "Store created successfully",
  "store": {
    "_id": "store_id",
    "name": "SuperMart",
    "image": "image_url"
  }
}`

## Get All Stores

Get a list of all stores.

- URL: `/`
- Method: `GET`
- Response:

  - Status Code: 200 (OK)
  - Body:

    `[
  {
    "_id": "store_id1",
    "name": "SuperMart",
    "image": "image_url1"
  },
  {
    "_id": "store_id2",
    "name": "Grocery World",
    "image": "image_url2"
  }
]`

## Get Store by ID

Get a store by its ID.

- URL: `/:id`
- Method: `GET`
- URL Params:
  - `id` (string, required): The store's ID.
- Response:

  - Status Code: 200 (OK)
  - Body:

    `{
  "_id": "store_id",
  "name": "SuperMart",
  "image": "image_url"
}`

## Update Store by ID

Update an existing store by its ID.

- URL: `/:id`
- Method: `PUT`
- URL Params:
  - `id` (string, required): The store's ID.
- Request Body:
  - `name` (string, required): The updated name of the store.
  - `image` (file): An optional updated image of the store.
- Example Request Body:

  `{
  "name": "Updated SuperMart"
}`

- Response:

  - Status Code: 200 (OK)
  - Body:

    `{
  "message": "Store updated successfully",
  "store": {
    "_id": "store_id",
    "name": "Updated SuperMart",
    "image": "updated_image_url"
  }
}`

## Delete Store by ID

Delete a store by its ID.

- URL: `/:id`
- Method: `DELETE`
- URL Params:
  - `id` (string, required): The store's ID.
- Response:

  - Status Code: 200 (OK)
  - Body:

    `{
  "message": "Store Updated"
}`
