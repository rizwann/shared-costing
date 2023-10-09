# Expense Tracker API Documentation

## User Authentication

### Register User

Register a new user.

- **URL:** `/auth/register`
- **Method:** `POST`
- **Request Body:**
- `username` (string, required): The username of the user.
- `email` (string, required): The email address of the user.
- `password` (string, required): The password for the user (at least 6 characters long).
- **Example Request Body:**

  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securePassword"
  }
  ```

- Response:

  - Status Code: 201 (Created)
  - Body:

```json
{
  "message": "User registered successfully"
}
```

### Login User

Log in an existing user.

- URL: `/auth/login`
- Method: `POST`
- Request Body:
- `email` (string, required): The email address of the user.
- `password` (string, required): The password for the user.
- Example Request Body:

`{
 "email": "john@example.com",
 "password": "securePassword"
}`

- Response:

- Status Code: 200 (OK)
- Body:

```json
{
  "message": "Login successful",
  "user": {
    "_id": "user_id",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Logout User

Log out the currently authenticated user.

- URL: `/auth/logout`
- Method: `GET`
- Response:

- Status Code: 200 (OK)
- Body:

```json
{
  "message": "User logged out"
}
```
