class Controller {

    static async showHomePage(req, res) {
        try {
            res.render('home', {
                search: true,
                loggedIn: false,
                games: []
            })
        } catch (e) {
            console.log(e)
            res.send(e)
        }
    }

    static async showUserProfile(req, res) {
        try {

        } catch (e) {
            console.log(e)
            res.send(e)
        }
    }

}

module.exports = Controller