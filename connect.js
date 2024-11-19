const { DefaultAzureCredential } = require("@azure/identity");
const pkg = require("pg"); // CommonJS syntax
require('dotenv').config();
console.log("PostgreSQL Host:", process.env.AZURE_POSTGRESQL_HOST);


// For system-assigned identity.
const credential = new DefaultAzureCredential();

// Acquire the access token inside an async function.
(async () => {
    try {
        // Get access token for Azure Database for PostgreSQL.
        const accessToken = await credential.getToken("https://ossrdbms-aad.database.windows.net/.default");
        console.log(accessToken.token)

        // Set up the PostgreSQL client using the token.
        const client = new pkg.Client({
            host: process.env.AZURE_POSTGRESQL_HOST, // e.g., "your-server-name.postgres.database.azure.com"
            user: process.env.AZURE_POSTGRESQL_USER, // e.g., "your-user@your-tenant"
            password:accessToken.token,            // Use the token for authentication
            database: process.env.AZURE_POSTGRESQL_DATABASE, // e.g., "your-database"
            port: Number(process.env.AZURE_POSTGRESQL_PORT),  // Usually 5432
            ssl: true // Handle SSL
        });

        // Connect to the database.
        await client.connect();
        console.log("Connected to PostgreSQL!");

        // CRUD Operations

        // 1. Create a new table (employees)
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS employees (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                age INT
            );
        `;
        await client.query(createTableQuery);
        console.log("Table 'employees' created successfully.");

        // 2. Insert a new employee into the table
        const insertQuery = `
            INSERT INTO employees (name, age)
            VALUES ('John Doe', 30), ('Jane Smith', 25);
        `;
        await client.query(insertQuery);
        console.log("New employees inserted.");

        // 3. Select and display all employees
        const selectQuery = 'SELECT * FROM employees;';
        const res = await client.query(selectQuery);
        console.log("Employees in the database:", res.rows);

        // 4. Update an employee's age
        const updateQuery = `
            UPDATE employees
            SET age = 35
            WHERE name = 'John Doe';
        `;
        await client.query(updateQuery);
        console.log("Employee age updated.");

        // 5. Delete an employee
        const deleteQuery = `
            DELETE FROM employees
            WHERE name = 'Jane Smith';
        `;
        await client.query(deleteQuery);
        console.log("Employee deleted.");

        // Close the connection.
        await client.end();
        console.log("Connection closed.");
    } catch (error) {
        console.error("Error connecting to PostgreSQL:", error);
    }
})();
