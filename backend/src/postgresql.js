import {pool} from "./database/connectionPostgreSQL.js";

//--------------------------------------------------------------------
//---------------------FUNCIONES---------------------------------------
//--------------------------------------------------------------------



//---------------------------------TABLA PROVINCIA----------------------------------------------


//--------------AGREGAR PROVINCIA-----------------------------
const addProvincia=async()=>{
    try{
        const result=await pool.query("INSERT INTO provincia(descripcion)"
                                     +   "VALUES ($1);", ["Jujuy"]);
        
        console.log(result);
        console.log("Provincias agregada!");
    }catch(error){
        console.error(error);
    }
}

//----------------------LISTAR PROVINCIA-----------------------------------
const getProvincia=async()=>{
    try{
        const result=await pool.query("SELECT id_provincia, descripcion FROM provincia;");
        
        console.log(result.rows);
        console.log("Provincia listadas");
    }catch(error){
        console.error(error);
    }
};

//--------------AGREGAR LOCALIDAD-----------------------------

const addLocalidad=async()=>{
    try{
        const result=await pool.query("INSERT INTO localidad(id_provincia, descripcion)"
                                     +   "VALUES ($1,$2);", [3,"Corrientes"]);
        
        console.log(result);
        console.log("localidad agregada!");
    }catch(error){
        console.error(error);
    }
};


//----------------------LISTAR LOCALIDAD-----------------------------------
const getLocalidad=async()=>{
    try{
        const result=await pool.query("SELECT id_localidad, id_provincia, descripcion FROM localidad;");
        
        console.log(result.rows);
        console.log("Localidades listadas");
    }catch(error){
        console.error(error);
    }
};






//--------------AGREGAR TITULAR FAENA-----------------------------

const addTitularFaena=async()=>{
    try{
        const result=await pool.query("INSERT INTO titular_faena(nombre, id_localidad)"
                                     +   "VALUES ($1,$2);", ["La Brava",1]);
        
        console.log(result);
        console.log("Titular de faena agregado!");
    }catch(error){
        console.error(error);
    }
};


//----------------------LISTAR TITULAR FAENA-----------------------------------
const getTitularFaena=async()=>{
    try{
        const result=await pool.query("SELECT id_titular_faena, id_localidad, nombre FROM titular_faena;");
        
        console.log(result.rows);
        console.log("Titulares de faena listadas");
    }catch(error){
        console.error(error);
    }
};




//--------------AGREGAR CATEGORIA ESPECIE-----------------------------

const addCategoriaEspecie=async()=>{
    try{
        const result=await pool.query("INSERT INTO categoria_especie(descripcion)"
                                     +   "VALUES ($1);", ["Vaquillonas"]);
        
        console.log(result);
        console.log("Especie agregada!");
    }catch(error){
        console.error(error);
    }
};

//----------------------LISTAR CATEGORIA ESPECIE-----------------------------------
const getCategoriaEspecie=async()=>{
    try{
        const result=await pool.query("SELECT id_cat_especie, descripcion FROM categoria_especie;");
        
        console.log(result.rows);
        console.log("Categoria listadas");
    }catch(error){
        console.error(error);
    }
};

//--------------AGREGAR ESPECIE-----------------------------

const addEspecie=async()=>{
    try{
        const result=await pool.query("INSERT INTO especie(id_cat_especie, descripcion)"
                                     +   "VALUES ($1,$2);", [1,"Bovinos"]);
        
        console.log(result);
        console.log("Especie agregada!");
    }catch(error){
        console.error(error);
    }
};



//----------------------LISTAR ESPECIE-----------------------------------
const getEspecie=async()=>{
    try{
        const result=await pool.query("SELECT id_especie,id_cat_especie, descripcion FROM especie;");
        
        console.log(result.rows);
        console.log("Especie listadas");
    }catch(error){
        console.error(error);
    }
};




//--------------AGREGAR ENFERMEDAD-----------------------------

const addEnfermedad=async()=>{
    try{
        const result=await pool.query("INSERT INTO enfermedad(descripcion)"
                                     +   "VALUES ($1);", ["Tuberculosis"]);
        
        console.log(result);
        console.log("Enfermedad agregada!");
    }catch(error){
        console.error(error);
    }
};



//----------------------LISTAR ENFERMEDAD-----------------------------------
const getEnfermedad=async()=>{
    try{
        const result=await pool.query("SELECT id_enfermedad,descripcion FROM enfermedad;");
        
        console.log(result.rows);
        console.log("Enfermedades listadas");
    }catch(error){
        console.error(error);
    }
};


//--------------AGREGAR TROPA-----------------------------

const addTropa=async()=>{
    try{
        const result=await pool.query("INSERT INTO Tropa(extendida_por, localidad, dte_dtu, guia_policial, fecha, id_titular_faena)"
                                     +   "VALUES ($1,$2,$3,$4,$5,$6);", ["Ivan", "Corrientes", "123-456", "222-111", "14-07-25", 1]);
        
        console.log(result);
        console.log("Tropa agregada!");
    }catch(error){
        console.error(error);
    }
};



//----------------------LISTAR ENFERMEDAD-----------------------------------
const getTropa=async()=>{
    try{
        const result=await pool.query("SELECT id_tropa, extendida_por, localidad, dte_dtu, guia_policial, fecha, id_titular_faena FROM tropa;");
        
        console.log(result.rows);
        console.log("Enfermedades listadas");
    }catch(error){
        console.error(error);
    }
};



//--------------AGREGAR TROPA DETALLE-----------------------------

const addTropaDetalle=async()=>{
    try{
        const result=await pool.query("INSERT INTO tropa_detalle(id_cat_especie, id_tropa, id_especie, cantidad)"
                                     +   "VALUES ($1,$2,$3,$4);", [1,2, 1, 100]);
        
        console.log(result);
        console.log("Detalle tropa agregada!");
    }catch(error){
        console.error(error);
    }
};



//----------------------LISTAR DETALLE TROPA-----------------------------------
const getTropaDetalle=async()=>{
    try{
        const result=await pool.query("SELECT id_tropa_detalle, id_tropa, id_especie, id_cat_especie, cantidad FROM tropa_detalle;");
        
        console.log(result.rows);
        console.log("Detalle de tropas listadas");
    }catch(error){
        console.error(error);
    }
};

//--------------AGREGAR FAENA-----------------------------

const addFaena=async()=>{
    try{
        const result=await pool.query("INSERT INTO faena(id_tropa, fecha_faena, cantidad_faena)"
                                     +   "VALUES ($1,$2,$3);", [2, "15-7-25", 50]);
        
        console.log(result);
        console.log("Faena agregada!");
    }catch(error){
        console.error(error);
    }
};



//----------------------LISTAR FAENA-----------------------------------
const getFaena=async()=>{
    try{
        const result=await pool.query("SELECT id_faena, id_tropa, fecha_faena, cantidad_faena FROM faena;");
        
        console.log(result.rows);
        console.log("Faenas listadas");
    }catch(error){
        console.error(error);
    }
};

//--------------AGREGAR DECOMISO-----------------------------

const addDecomiso=async()=>{
    try{
        const result=await pool.query("INSERT INTO decomiso(id_faena, id_enfermedad, cantidad_afectados)"
                                     +   "VALUES ($1,$2,$3);", [2, 1, 10]);
        
        console.log(result);
        console.log("Decomiso agregado!");
    }catch(error){
        console.error(error);
    }
};



//----------------------LISTAR FAENA-----------------------------------
const getDecomiso=async()=>{
    try{
        const result=await pool.query("SELECT id_decomiso, id_faena, id_enfermedad, cantidad_afectados FROM decomiso;");
        
        console.log(result.rows);
        console.log("Decomisos listadas");
    }catch(error){
        console.error(error);
    }
};

//--------------AGREGAR ROL USUARIO-----------------------------

const addRolUsuario=async()=>{
    try{
        const result=await pool.query("INSERT INTO rol_usuario(descripcion)"
                                     +   "VALUES ($1);", ["SuperAdmin"]);
        
        console.log(result);
        console.log("Rol agregado!");
    }catch(error){
        console.error(error);
    }
};

//----------------------LISTAR FAENA-----------------------------------
const getRolUsuario=async()=>{
    try{
        const result=await pool.query("SELECT id_rol, descripcion FROM rol_usuario;");
        
        console.log(result.rows);
        console.log("Roles de usuarios listadas");
    }catch(error){
        console.error(error);
    }
};




//addProvincia();
//getProvincia();
//
//addLocalidad();
//getLocalidad();
//
//addCategoriaEspecie();
//getCategoriaEspecie();
//
//addEspecie();
//getEspecie();
//
//addEnfermedad();
//getEnfermedad();
//
//addTropa();
//getTropa();
//
//addTropaDetalle();
//getTropaDetalle();
//
//addFaena();
//getFaena();
//
//addTitularFaena();
//getTitularFaena();
//
//addDecomiso();
//getDecomiso();
//
//addRolUsuario();
//getRolUsuario();
//
//