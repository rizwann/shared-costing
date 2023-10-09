House Routes API Documentation

==============================

These are the API endpoints for managing houses.

Base URL

---

bash

`/houses`

Create a New House

---

Create a new house with image upload.

- URL: `/create`

- Method: `POST`

- Request Body:

- `code` (string, required): The unique code for the house.

- `description` (string, required): The description of the house.

- `image` (file): An optional image of the house.

- Example Request Body:

`{

"code": "house123",

"description": "Spacious Villa"

}`

- Response:

- Status Code: 201 (Created)

- Body:

`{

"message": "House created successfully",

"house": {

"\_id": "house_id",

"code": "house123",

"description": "Spacious Villa",

"image": "image_url",

"users": ["user_id"]

}

}`

Get Houses by User ID

---

Get a list of houses associated with a specific user.

- URL: `/:id`

- Method: `GET`

- URL Params:

- `id` (string, required): The user's ID.

- Response:

- Status Code: 200 (OK)

- Body:

`[

{

"\_id": "house_id1",

"code": "house123",

"description": "Spacious Villa",

"image": "image_url1",

"users": ["user_id"]

},

{

"\_id": "house_id2",

"code": "house456",

"description": "Cozy Cottage",

"image": "image_url2",

"users": ["user_id"]

}

]`

Update House by ID

---

Update an existing house by its ID.

- URL: `/:id`

- Method: `PUT`

- URL Params:

- `id` (string, required): The house's ID.

- Request Body:

- `description` (string, required): The updated description of the house.

- `image` (file): An optional updated image of the house.

- Example Request Body:

`{

"description": "Updated Villa Description"

}`

- Response:

- Status Code: 200 (OK)

- Body:

`{

"message": "House updated successfully",

"house": {

"\_id": "house_id",

"code": "house123",

"description": "Updated Villa Description",

"image": "updated_image_url",

"users": ["user_id"]

}

}`

Delete House by ID

---

Delete a house by its ID.

- URL: `/:id`

- Method: `DELETE`

- URL Params:

- `id` (string, required): The house's ID.

- Response:

- Status Code: 200 (OK)

- Body:

`{

"message": "House Updated"

}`

Join a House

---

Join an existing house by providing the house code.

- URL: `/join-house`

- Method: `POST`

- Request Body:

- `houseCode` (string, required): The code of the house to join.

- Example Request Body:

`{

"houseCode": "house123"

}`

- Response:

- Status Code: 200 (OK)

- Body:

`{

"message": "Joined house successfully"

}`

- Status Code: 400 (Bad Request) if the user is already in the house.

`{

"message": "User is already in the house"

}`

- Status Code: 404 (Not Found) if the house is not found.

`{

"message": "House not found"

}`

- Status Code: 401 (Unauthorized) if the user is not authenticated.

`{

"message": "Unauthorized"

}`

- `

`
