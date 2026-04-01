class AuthController {

    static async showLogin(req, res) {
        try {
            res.render('login', {})
        } catch (e) {
            console.log(e)
            res.send(e)
        }
    }

    static async login(req, res) {
        try {

        } catch (e) {
            console.log(e)
            res.send(e)
        }
    }

    static async showRegister(req, res) {
        try {
            
        } catch (e) {
            console.log(e)
            res.send(e)
        }
    }

    static async register(req, res) {
        try {
            
        } catch (e) {
            console.log(e)
            res.send(e)
        }
    }
}

module.exports = AuthController