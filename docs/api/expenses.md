# Expense Tracker API Documentation

This documentation provides details about the endpoints and functionalities of the Expense Tracker API.

## Base URL

The base URL for this route is `/expenses`.

## Expense Endpoints

### Create a New Expense

- **URL:** `/create`
- **Method:** POST
- **Description:** Create a new expense.
- **Request Body:** See example below.
- **Example Request:**

  ```json
  {
    "cost": 50.0,
    "category": "Groceries",
    "description": "Monthly grocery shopping",
    "houseCode": "HOUSE123"
  }
  ```

- Response:
  - `message` (string): Success message.
  - `expense` (object): The created expense object.

### Get a Single Expense by ID

- URL: `/:id`
- Method: GET
- Description: Retrieve a single expense by its ID.
- URL Parameters:
  - `id` (string): The ID of the expense.
- Response:
  - `expense` (object): The expense object.

### Get All Expenses by User ID

- URL: `/user/:id`
- Method: GET
- Description: Retrieve all expenses associated with a user by their ID.
- URL Parameters:
  - `id` (string): The ID of the user.
- Response:
  - `expenses` (array): An array of expense objects.

### Update an Expense by ID

- URL: `/edit/:id`
- Method: PUT
- Description: Update an expense by its ID.
- URL Parameters:
  - `id` (string): The ID of the expense.
- Request Body: See example below (optional).
- Example Request:

  jsonCopy code

  `{
  "cost": 60.00
}`

- Response:
  - `expense` (object): The updated expense object.

### Delete an Expense by ID

- URL: `/:id`
- Method: DELETE
- Description: Delete an expense by its ID.
- URL Parameters:
  - `id` (string): The ID of the expense.
- Response:
  - `message` (string): Success message.

### Get All Expenses by User ID and House Code

- URL: `/user/:id/:houseCode/all`
- Method: GET
- Description: Retrieve all expenses associated with a user in a specific house by their user ID and house code.
- URL Parameters:
  - `id` (string): The ID of the user.
  - `houseCode` (string): The code of the house.
- Response:
  - `expenses` (array): An array of expense objects.

### Get All Expenses by House Code

- URL: `/house/:houseCode/all`
- Method: GET
- Description: Retrieve all expenses associated with a specific house by its code.
- URL Parameters:
  - `houseCode` (string): The code of the house.
- Response:
  - `expenses` (array): An array of expense objects.

### Get Expenses of Current Month by User ID in a Specific House

- URL: `/user/:id/:houseCode/currentMonth`
- Method: GET
- Description: Retrieve expenses of the current month associated with a user in a specific house by their user ID and house code.
- URL Parameters:
  - `id` (string): The ID of the user.
  - `houseCode` (string): The code of the house.
- Response:
  - `expenses` (array): An array of expense objects for the current month.

### Get Expenses of Current Year by User ID in a Specific House

- URL: `/user/:id/:houseCode/currentYear`
- Method: GET
- Description: Retrieve expenses of the current year associated with a user in a specific house by their user ID and house code.
- URL Parameters:
  - `id` (string): The ID of the user.
  - `houseCode` (string): The code of the house.
- Response:
  - `expenses` (array): An array of expense objects for the current year.

### Get Expenses of a Specific Year by User ID in a Specific House

- URL: `/user/:id/:houseCode/:year`
- Method: GET
- Description: Retrieve expenses of a specific year associated with a user in a specific house by their user ID, house code, and year.
- URL Parameters:
  - `id` (string): The ID of the user.
  - `houseCode` (string): The code of the house.
  - `year` (string): The year for which expenses are to be retrieved.
- Response:
  - `expenses` (array): An array of expense objects for the specified year.

### Get Expenses of Specific Month and Year by User ID in a Specific House

- URL: `/user/:id/:houseCode/:year/:month`
- Method: GET
- Description: Retrieve expenses of a specific month and year associated with a user in a specific house by their user ID, house code, year, and month.
- URL Parameters:
  - `id` (string): The ID of the user.
  - `houseCode` (string): The code of the house.
  - `year` (string): The year for which expenses are to be retrieved.
  - `month` (string): The month for which expenses are to be retrieved (numeric, e.g., 01 for January).
- Response:
  - `expenses` (array): An array of expense objects for the specified month and year.

### Get All Expenses of Current Month in a Specific House

- URL: `/house/:houseCode/currentMonth`
- Method: GET
- Description: Retrieve expenses of the current month associated with a specific house by its code.
- URL Parameters:
  - `houseCode` (string): The code of the house.
- Response:
  - `expenses` (array): An array of expense objects for the current month.

### Get Expenses of a Specific Year in a Specific House

- URL: `/house/:houseCode/:year`
- Method: GET
- Description: Retrieve expenses of a specific year associated with a specific house by its code and year.
- URL Parameters:
  - `houseCode` (string): The code of the house.
  - `year` (string): The year for which expenses are to be retrieved.
- Response:
  - `expenses` (array): An array of expense objects for the specified year.

### Get Expenses of Specific Month and Year in a Specific House

- URL: `/house/:houseCode/:year/:month`
- Method: GET
- Description: Retrieve expenses of a specific month and year associated with a specific house by its code, year, and month.
- URL Parameters:
  - `houseCode` (string): The code of the house.
  - `year` (string): The year for which expenses are to be retrieved.
  - `month` (string): The month for which expenses are to be retrieved (numeric, e.g., 01 for January).
- Response:
  - `expenses` (array): An array of expense objects for the specified month and year.

## Usage

To use the Expense Tracker API, follow the provided documentation for each endpoint and make HTTP requests accordingly. You can use tools like Postman or your preferred programming language to interact with the API.

## License

This project is licensed under the [MIT License](https://chat.openai.com/c/LICENSE).
