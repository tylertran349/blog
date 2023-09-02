# Blog API for [Blog Project](https://github.com/tylertran349/blog-front-end)
This is a RESTful API that can be used to build a blog client/front-end.
Visit the live blog front-end for this project [here](https://github.com/tylertran349/blog-front-end)

## How to Run This App Locally
1. Clone the repository to your local machine using the command ```git clone git@github.com:tylertran349/blog-api.git```
2. Navigate to the project folder using the command ```cd blog-api```
3. Install the required dependencies by running ```npm install```.
4. Set up a MongoDB database.
5. Create a ```.env``` file in the ```blog-api``` folder with the following environment variables:
```
MONGO_URL="INSERT_YOUR_MONGODB_DATABASE_URL_HERE"
JWT_SECRET_KEY="INSERT_ANY_STRING_HERE"
ADMIN_PASSCODE="INSERT_ANY_STRING_HERE"
PORT="INSERT_ANY_NUMBER_FROM_1_THROUGH 65535_HERE"
```
6. Start the server using the command ```node app.js```.
7. Open http://localhost:3000 (change the port number if needed) with your browser to see the result.

## Technologies
- Node.js
- Express
- MongoDB
- PassportJS for local and JWT authentication