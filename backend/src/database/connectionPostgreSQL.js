import pg from "pg";

export const pool= new pg.Pool({
    host:"localhost",
    port:5432,
    database:"sistema_faenasdb",
    user:"postgres",
    password:"sm2224mptt"
});