const passport = require ('passport');
const local = require ('passport-local');
const github = require ('passport-github2');

const UserModel = require ('../models/user.models')
const { createHash, isValidPassword }= require ('../utils/hashBcrypt')

//estrategia local
const LocalStrategy  = local.Strategy;

//estrategia github
const GithubStrategy  = github.Strategy;

/* 
App ID: 851023
Client ID: Iv1.11d64c1fa3cb63e0 
Client secret : c99836d1197c68c06ca2f050ef69ea72c0501529
*/

//inicializador de middlewares de passport
const initializePassport = () => {
    
    passport.use('register', //nombre de la estrategia
        new LocalStrategy({
            passReqToCallback: true, //acceso al objeto req
            usernameField : 'email'
        },
        async (req, username, password, done) => { //funcion CB
            const {first_name, last_name, email, age} = req.body;

            try {
                const user = await UserModel.findOne({ email: email.toLowerCase()});
                
                if (user) return done(null, false); //user no disponible
                
                const newUser ={
                    first_name,
                    last_name,
                    email,
                    age,
                    password: createHash(password)
                }

                //genermaos el usre y lo mandamos con done
                const  result = await UserModel.create(newUser);
                return done(null, result);

            } catch (error) {
                return done(error)
            }
        })
    )

    passport.use('login',
        new LocalStrategy({
            usernameField : 'email'
        },
        async (email, password, done)=>{
            try {
                const user = await UserModel.findOne({ email: email.toLowerCase()});

                if(!user) return done(null, false) //No existe el usuario

                if(!isValidPassword(password, user)) return done (null,false)//la contrasena es incorrecta

                return done(null, user)
            } catch (error) {
                return done(error)
            }
        })
    )

    passport.use('github', 
        new GithubStrategy({
            clientID: 'Iv1.11d64c1fa3cb63e0',
            clientSecret: 'c99836d1197c68c06ca2f050ef69ea72c0501529',
            callbackURL: "http://localhost:8080/api/sessions/githubcallback"
        }, 
        async (accessToken, refreshToken, profile, done)=>{
            //en profile._json tengo los datos que quiero
            const user = await UserModel.findOne({email : profile._json.email })
            console.log(profile._json)
            try {
                //una vez buscado el user, si no existe, lo creamos. de lo contrario lo retornamos
                if (!user){
                    const newUser = {
                        first_name : profile._json.name,
                        last_name : "",
                        age : 10,
                        email : profile._json.email,
                        password : ''
                    }
                    const result = await UserModel.create(newUser);
                    return done(null, result)
                }else{
                    return done(null, user);
                }
            } catch (error) {
                return done (error)
            }
            
        })
    )

    passport.serializeUser((user, done) =>{
        done(null, user._id);
    })

    passport.deserializeUser( async (id ,done) =>{
        const user = await UserModel.findById({_id : id});
        done(null, user);
    })

}

module.exports = initializePassport;