const UserRepository = require("../repositories/user.repository.js");
const userRepository = new UserRepository();

const generateToken =  require('../utils/resetPassToken.js');
const {sendRecoveryPassMail} = require('../services/emailsManager.js');
const {isValidPassword} = require('../utils/hashBcrypt.js');

class userController{

    //ruta ':uid/documents', método POST
    async addDocuments(req, res){
        try {
            const {document, homeBill, bankBill} = req.body;
            const {uid} = req.params;

            const user = await userRepository.getUserbyId(uid);
            if(!user){
                throw 'No hay un usuario registrado con el id ingresado';
            }
            await userRepository.addDocuments(user, document, homeBill, bankBill);
            res.status(200).redirect('/')
        } catch (error) {
            req.logger.error('error al camiar al agregar documentos al usuario.', error)
            res.send(error)
        }
    }

    //ruta ¨/failedRegister¨, metodo GET
    async failRegister (req,res){
        res.send({error: 'registro fallido'})
    }

    //ruta ¨/requestPasswordReset¨, metodo POST
    async requestPasswordResetEmail(req,res){
        try {
            const email = req.body.email;
            if (!email) {
                return res.status(400).send({ message: 'Email is required' });
            }

            const user = await userRepository.getUserbyEmail(email);
            if (!user) {
                return res.status(404).send({ message: 'No se obtiene un usuario al cual enviarle el correo de recuperacion' });
            }

            const token = generateToken();
            await userRepository.saveTokenInUser(user, token)
                
            await sendRecoveryPassMail(email, user.first_name, token)
                .then(()=> res.render('confirmacionDeEnvio'))
                
        } catch (error) {
            req.logger.error('error al enviar mail de recuepracion.', error)
            res.send(error)
        }
    }

    //ruta ¨/passwordReset¨, metodo POST
    async passwordReset(req,res){
        try {
            const {email, token, password} = req.body;

            const user = await userRepository.getUserbyEmail(email);
            if(!user){
                throw `No existe un usuario con ese email.`
            }

            if((user.resetToken.token !== token)){
                throw `Token invalido.`
            }
            
            if(user.resetToken.exipresAt < new Date()){ //expirtesAt < date now tambien cero
                throw `Token vencido.`
            }
            
            if (isValidPassword(password, user)){
                throw `No se puede ingresar la misma contraseña.`
            }

            await userRepository.changeUserPass(user, password)
                .then(()=> res.redirect('/loginForm'))

        } catch (error) {
            req.logger.error('error al resetaear la contraseña.', error)
            res.send(error)
        }

    }

    //ruta ¨//premium/:uid¨, metodo POST
    async changeUserRol(req,res){
        try {
            //Me guardo el id del user
            let uid = req.params.uid;

            const user = await userRepository.getUserbyId(uid);
            if(!user){
                throw `No existe un usuario con ese id.`
            }

            if(user.rol === 'usuario'){
                const docs = user.documents;
                if(docs.length===0){
                    return res.send('Para convertirte en usuario premium, primero debes cargar todos los documentos necesarios!!')
                }
                if(docs[0].reference === "" || docs[1].reference === "" || docs[2].reference === ""){
                    return res.send('Para convertirte en usuario premium, primero debes cargar todos los documentos necesarios!!')
                }

                await userRepository.changeUserRol(user, 'premium')
                    .then(()=> {
                        req.logger.info(`rol de user con id ${uid}, cambiado de usuario a premium`)
                        res.redirect('/')}
                    )
            }else if(user.rol === 'premium'){
                await userRepository.changeUserRol(user, 'usuario')
                    .then(()=> {
                        req.logger.info(`rol de user con id ${uid}, cambiado de premium a usuario`)
                        res.redirect('/')}
                    )
            }        

        } catch (error) {
            req.logger.error('error al camiar el rol del user.', error)
            res.send(error)
        }

    }
}

module.exports = userController;