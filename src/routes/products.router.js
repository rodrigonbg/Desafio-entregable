const express = require("express");
const router = express.Router();

//product manager
const ProductManager = require('../dao/db/product-manager-db')
const productManager = new ProductManager();


//ROUTING

/* ----------------------------------------GETs----------------------------------------------- */
//Productos por querys
router.get("/", async (req, res)=>{
    try {
        //Guardamos los query (recordar que el query se levantan con ?limit=5&page=2...)
        let { limit, page, priceOrder, ...queryObject} = req.query

        //en limit, page y priceOrder, uso ternarios, si exsite el valor correcto, lo uso, de lo contrario, le doy un valor por defecto
        //Unque ya estaban creados, con esto agrego mas validaciones
        limit = parseInt(Number(req.query.limit)? req.query.limit : 10); //si el limit es un unmero y existe, tomo su valor, de lo contrario, por defecto 10
        page = parseInt(Number(req.query.page)? req.query.page : 1); //por defecto tiene que ser 1
        priceOrder = (req.query.priceOrder === 'asc' || req.query.priceOrder === 'des') ? req.query.priceOrder : null // por defecto no hace ordenamiento

        //Creo el objeto de orden si es que hay
        let order = {}
        if (priceOrder !== null){
            order = {
                price : priceOrder === 'asc'? 1 : -1 
            }
        }

        //Cargamos el array de productos con los querys, el limiete, la page y el orden
        const arrayProductos = await productManager.getProducts({queryObject, limit, page, order});
        return res.send(arrayProductos)

    } catch (error) {
        return res.send(`Error al mostrar los productos. Error: ${error}`)
    }
})

//productos por ID
router.get("/:pid", async (req, res)=>{
    try{
        //Me guardo el id 
        let pid = req.params.pid

        //guardo el prod con ese id
        const prod = await productManager.getProductById(pid);

        if(prod){
            return res.send(prod)
        }else{
            return res.send(`El ID: ${pid} del producto es incorrecto.`)
        }
    }catch(error){
        return res.send(`Error al mostrar el producto de ID ${req.params.pid}. Error (${error})`)
    }
})

/* ----------------------------------------POSTs----------------------------------------------- */
//Subir un producto a la base de datos
router.post("/", async (req, res)=>{
    try {
        //info del producto desde el body
        //let {title, description, categoria, idCategoria, thumbnail, price, onSale, descuento, stock, alt, status=true, code } = req.body;
        await productManager.addProduct(req.body)
            .then(respuesta => res.send(respuesta))
    } catch (error) {
        return res.send(`Error al subir el nuevo producto. Error: ${error}`)
    }
})

/* ----------------------------------------PUTs----------------------------------------------- */
//Actualizar un producto en la base de datos
router.put("/:pid", async (req, res)=>{
    try {
        //Me guardo el id 
        let pid = req.params.pid;

        //info del producto desde el body
        //let {title, description, categoria, idCategoria, thumbnail, price, onSale, descuento, stock, alt, status=true, code } = req.body;
        await productManager.updateProduct(pid ,req.body)
            .then(respuesta => res.send(respuesta))
    } catch (error) {
        res.send(`Error al actualizar el producto. ERROR ${error}`)
    }
})

/* ----------------------------------------DELETEs----------------------------------------------- */
//Eliminar un producto de la base de datos
router.delete("/:pid", async (req, res)=>{
    try {
        //Me guardo el id 
        let pid = req.params.pid;
        await productManager.deleteProduct(pid)
            .then(respuesta => res.send(respuesta))

    }catch(error){
        return res.send(`Error al eliminar el producto. ERROR ${error}`)
    }
})

module.exports = router;