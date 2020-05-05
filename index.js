var express = require('express');
var app = express();
var mysql = require('mysql');
var fs = require('fs');

/**
 * / (racine)
 * retourne le code promo associé à la chaine de caractères passée en paramètre (qrcode)
 * 
 */
app.get('/', (req, res) => {
    // connexion à la base de donnée
    let mySqlClient = createConnection(mysql);

    const promise1 = new Promise(function(resolve,reject){
        //dans un premier temps, récupération du paramètre contenant le contenu du qrcode 
        console.log('-------------------------------------------------------');
        console.log('URI params : ', req.url);

        let qrcode = req.param('qrcode');

        if(qrcode != undefined){
            console.log('qrcode : \'' + qrcode + '\'');

            //syntaxe correcte du paramètre qrcode : 'gostylecode_{uuid}'
            var entete = qrcode.split('_')[0];      //doit contenir la chaine 'gostylecode'
            var uuid = qrcode.split('_')[1];        //doit contenir un uuid
            if(entete == "gostylecode"){
                resolve(uuid);  //renvois de l'identifiant du code promo présent dans le qrcode
            } else {
                reject("Ce QRCode n\'appartient pas à Go Style");
            }
        } else {
            reject("url invalide");
        }
    })
    .then(function(uuid){
        //initialisation de la variable contenant l'appel à la procédure stockée get_code_promo
        let selectQuery = 'CALL get_code_promo(' + uuid + ');';
        //cette dernière retourne le code promo correspondant à l'identifiant passé en paramètre, si la date de validité du code promo est correcte
        console.log('Requete SQL : ',selectQuery);

        mySqlClient.query(      //execution de la requête
            selectQuery,
            function select(error, results) {
                if (error) {                                //ERROR
                    writeInLog(error,selectQuery);
                    console.log('error SQL :',error);
                    mySqlClient.end();
                    return;
                }
                if ( results.length > 0 )  {                //RESULT
                    var firstResult = results[0][0];
                    res.send(firstResult.code); 
                    console.log('reponse : ',firstResult.code);
                    
                } else {                                    //NO DATA
                    res.send('Pas de données');
                    console.log('reponse : ',"Pas de données");
                }
                mySqlClient.end();
            }
        );
    })
    .catch(function(error){
        console.log('reponse : ', error);
        res.send(error);
    });
});


/**
 * /liste
 * Renvois la liste des codes promo en cours de validité, au format JSON
 */

app.get("/liste", (req, res) => {
    console.log('-------------------------------------------------------\n/liste');
    // connexion à la base de donnée
    let mySqlClient = createConnection(mysql);

    selectQuery = 'CALL get_all_available_promo();';
    //initialisation de la variable contenant l'appel à la procédure stockée get_code_promo
    //cette dernière retourne le code promo correspondant à l'identifiant passé en paramètre, si la date de validité du code promo est correcte
    console.log('Requete SQL : ',selectQuery);
    mySqlClient.query(      //execution de la requête
        selectQuery,
        function select(error, results) {
            if (error) {
                writeInLog(error,selectQuery);
                console.log('error SQL :',error);
                mySqlClient.end();
                return;
            }
            if ( results.length > 0 )  { 
                res.send(results[0]);
                console.log('reponse : ',results[0]);
            } else {
                res.send('Pas de données');
                console.log('reponse : ',"Pas de données");
            }
            mySqlClient.end();
        }
    );
})



app.listen(4000, function () {
    console.log("En écoute sur le port 4000");
});

function createConnection(mysql){
    return mySqlClient = mysql.createConnection({
        host     : "localhost",
        user     : "root",
        password : "",
        database : "go_style_project_db"
    });
}

function writeInLog(error,selectQuery){
    fs.appendFile('error.log', "--------------------------------------------\n"+error+"\nOn request : "+selectQuery+"\n", function (err) {
        if (err) throw err;
        console.log('Error => log');
    });
}