const express = require('express')
const { login, checkOutOrder, signup, singleFile, singleFile2, orderId, fetchOrders, fetchOrderId, visitors, postTXT, zip, ip, stats, statsLogin } = require('../controller/controller')
const multer = require('multer')

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'myuploads')
    },
    filename : function(req,file,cb){
        cb(null,file.originalname)
    }
})


const upload = multer({storage})
const router = express.Router()

router.post('/signup',signup)
router.post("/login",login)
router.post('/singleFile',upload.single("file"),singleFile)
router.post('/singleFile2',upload.single("file"),singleFile2)
router.post("/checkout_order",checkOutOrder)
router.post("/postTxt",postTXT) 
router.post('/zip',zip)
router.post('/ip',ip)
router.get('/visitors',visitors)
router.post('/checkout_order_update/:order_id', orderId)
router.get('/fetch_single_order/:order_id',fetchOrderId)
router.get('/fetch_orders',fetchOrders)
router.get('/stats',stats)
router.get('/stats/login',statsLogin)


module.exports=router