
/**
 * @depends {3rdparty/jquery-2.1.0.js}
 * @depends {3rdparty/bootstrap.js}
 * @depends {3rdparty/big.js}
 * @depends {3rdparty/jsbn.js}
 * @depends {3rdparty/jsbn2.js}
 * @depends {3rdparty/webdb.js}
 * @depends {3rdparty/growl.js}
 * @depends {crypto/curve25519.js}
 * @depends {crypto/curve25519_.js}
 * @depends {crypto/base58.js}
 * @depends {crypto/blake32.js}
 * @depends {crypto/keccak32.js}
 * @depends {crypto/passphrasegenerator.js}
 * @depends {crypto/sha256worker.js}
 * @depends {crypto/3rdparty/cryptojs/aes.js}
 * @depends {crypto/3rdparty/cryptojs/sha256.js}
 * @depends {crypto/3rdparty/jssha256.js}
 * @depends {crypto/3rdparty/seedrandom.js}
 * @depends {util/converters.js}
 * @depends {util/extensions.js}
 * @depends {waves.js}
 */
var Waves = (function(Waves, $, undefined) {
	"use strict";

    //Delete hack later.
    var balance  = 0;


    Waves.hasLocalStorage = false;

    Waves.initApp = function () {

        if (!_checkDOMenabled()) {
            Waves.hasLocalStorage = false;
        } else {
            Waves.hasLocalStorage = true;
       }

        $("#wrapper").hide();
        $("#lockscreen").show();
        $("#lockscreenTable").show();

        $("#loginButton").on("click", function() {
            
            Waves.initPreview();

        });

    }

    Waves.initPreview = function() {


        Waves.loadBlockheight();
        Waves.loadBalance();
        Waves.loadHistory();

        $("#lockscreen").hide();
        $("#lockscreenTable").hide();
        $("#wrapper").show();


    }

    Waves.loadBlockheight = function () {

        Waves.apiRequest(Waves.api.blocks.height, function(result) {
            
            $("#blockheight").html(result.height);

        });

        

    }

    Waves.loadBalance = function () {


        Waves.apiRequest(Waves.api.address.getAddresses(), function(response) {

            balance = 0;

            var account = 0;

            $.each(response, function(key, value) {


                Waves.apiRequest(Waves.api.address.balance(value), function(balanceResult) {

                    balance = balance + balanceResult.balance;

                    $("#wavesbalance").html(balance)

                    $("#balancespan").html(balance +' Waves');

                    $('.balancewaves').html(balance + ' Waves');

                });

            });
        });


    }

    Waves.loadHistory = function () {

        var signatures = [];
        var appContainer;

        Waves.apiRequest(Waves.api.address.getAddresses(), function(response) {

            balance = 0;

            $.each(response, function(key, value) {


                Waves.apiRequest(Waves.server+'/transactions/address/'+value, function(transactionHistory) {

                    $.each(transactionHistory[0], function(historyKey, historyValue) {

                        if(historyValue.timestamp > 0) {

                            if(signatures.indexOf(historyValue.signature) < 0) {

                                signatures.push(historyValue.signature);

                                appContainer += '<tr>';
                                appContainer += '<td>'+historyValue.timestamp+'</td>';
                                appContainer += '<td>'+historyValue.type+'</td>';
                                appContainer += '<td>'+historyValue.sender+'</td>';
                                appContainer += '<td>'+historyValue.recipient+'</td>';
                                appContainer += '<td>'+historyValue.fee+'</td>';
                                appContainer += '<td>'+historyValue.amount+' Waves</td>';

                                appContainer += '</tr>';

                            }
                            
                            
                            
                        }


                    });

                    

                });



            });

            
        });

        setTimeout(function() {

            $("#transactionhistory").html(appContainer);

        }, 1000);

    }

    // Show/hide different sections on tab activation
    $('input[type=radio]').click(function(){

        $('.mBB-content, .LBmBB-content').fadeOut(200).delay(400);
        $('#' + $(this).val()).fadeIn(800);
        $('#LB' + $(this).val()).fadeIn(800);

        var linkType = $(this).val();

        switch(linkType) {
            case 'mBB-portfolio':
                Waves.loadPayment();
            break;
        }
    });



    Waves.loadPayment = function () {

        var paymentForm = '</div><div id="payment_response"></div>';

            paymentForm += '<h2 style="margin-top: .5rem;">SEND PAYMENT</h2>'+
                            '<form id="paymentForm">'+
                                '<div class="paymentForm">'+
                                  '  <table>'+
                                  '     <thead>'+
                                  '         <tr>'+
                                  '             <th>DESCRIPTION</th>'+
                                  '             <th>INPUT</th>'+
                                  '         </tr>'+
                                  '     </thead>'+
                                  '     <tbody>'+
                                  '         <tr>'+
                                  '             <td>Sender (choose one account with balance from above)</td>'+
                                  '             <td><input type="text" class="form-control" id="sender" placeholder="Sender"></td>'+
                                  '         </tr>'+
                                  '         <tr>'+
                                  '             <td>Recipient</td>'+
                                  '             <td><input type="text" class="form-control" id="recipient" placeholder="Recipient"></td>'+
                                  '         </tr>'+
                                  '         <tr>'+
                                  '             <td>Amount</td>'+
                                  '             <td><input type="number" class="form-control" id="sendamount" placeholder="Amount" min="0"></td>'+
                                  '         </tr>'+
                                  '         <tr>'+
                                  '             <td>Fee</td>'+
                                  '             <td><p>Fee 1 Waves</p></td>'+
                                  '         </tr>'+
                                  '         <tr>'+
                                  '             <td>Send</td>'+
                                  '             <td><button id="sendpayment" class="paymentForm-but fade" value="send">SUBMIT</button></td>'+
                                  '         </tr>'+

                                  '     </tbody>'+
                                  '   </table>'+
                                  '</div>'+
                            '</form>';


            paymentForm += '</div>';


        $("#portfolio").html(paymentForm);


        Waves.apiRequest(Waves.server+'/addresses', function(response) {


            balance = 0;

            $.each(response, function(key, value) {

                $.each(value, function(innerkey, innervalue) {

                    Waves.apiRequest(Waves.server+'/addresses/balance/'+innervalue, function(balanceResult) {


                        $("#accounts_table").append('<tr><td>'+innervalue +'</td><td>'+balanceResult.balance+' Waves</td></tr>');

                    });

                });
            });
        });


        $("#sendpayment").on("click", function(e) {

            e.preventDefault();

            var amount = $("#sendamount").val();
            var recipient = $("#recipient").val();
            var sender = $("#sender").val();

            $("#sendpayment").on("click", function() {


                if(amount > 0) {

                    if(recipient > '') {

                        var number = Number(amount);

                        $.ajax({
                            url: Waves.server+'/payment',
                            data: JSON.stringify({
                                "amount": number,
                                "fee": 1,
                                "sender": sender,
                                "recipient": recipient
                            }),
                            type: "POST",
                            success: function(successrequest){
                    

                                $("#sendamount").val('');
                                $("#recipient").val('');
                                $("#sender").val('');

                                var messageTable = '<div class="wavesTable">'+
                                                        '<table>'+
                                                        '   <thead>'+
                                                        '       <tr>'+
                                                        '           <th>Key</th>'+
                                                        '           <th>Value</th>'+
                                                        '       </tr>'+
                                                        '   </thead>'+
                                                        '   <tbody>'+
                                                        '       <tr>'+
                                                        '           <th>Timestamp</th>'+
                                                        '           <td>'+successrequest.timestamp+'</td>'+
                                                        '       </tr>'+
                                                        '       <tr>'+
                                                        '           <th>Sender</th>'+
                                                        '           <td>'+successrequest.sender+'</td>'+
                                                        '       </tr>'+
                                                        '       <tr>'+
                                                        '           <th>Recipient</th>'+
                                                        '           <td>'+successrequest.recipient+'</td>'+
                                                        '       </tr>'+
                                                        '       <tr>'+
                                                        '           <th>Amount</th>'+
                                                        '           <td>'+successrequest.amount+' Waves</td>'+
                                                        '       </tr>'+
                                                        '       <tr>'+
                                                        '           <th>Fee</th>'+
                                                        '           <td>'+successrequest.fee+' Waves</td>'+
                                                        '       </tr>'+
                                                        '       <tr>'+
                                                        '           <th>Signature</th>'+
                                                        '           <td>'+successrequest.signature+'</td>'+
                                                        '       </tr>'+
                                                        '   </tbody>'+
                                                        '</table>'+
                                                    '</div>';

                                $("#payment_response").html('<h3>Sending successfull</h3>'+messageTable);

                            },
                            error: function(response){
                                $("#payment_response").html(response.message);
                                console.log(response);
                            }
                        });

                        

                    } else {
                        alert ('Please insert a recipient');
                    }

                } else {
                    alert ('Please insert an amount higher than 0');
                }

            });


        });


    }




    Waves.loadWallet = function () {

        var appContainer;

        Waves.apiRequest(Waves.server+'/addresses', function(response) {

            appContainer += '<h2>YOUR WALLETS</h2><div class="wavesTable">';

            appContainer += '<table>';
            appContainer += '<thead><tr><th>Key</th><th>Value</th></tr></thead>';
            appContainer += '<tbody>';

            $.each(response, function(key, value) {

                $.each(value, function(innerkey, innervalue) {

                    appContainer += '<tr><td>';
                    appContainer += innerkey;
                    appContainer += '</td><td>';
                    appContainer += innervalue;
                    appContainer += '</td></tr>';

                });

                

            });

            appContainer += '<tbody>';

            appContainer += '</div>';

            appContainer += '<button class="btn btn-primary" id="newAddress">New Address</button>';

            
            $("#walletContainer").html(appContainer);

            $("#newAddress").on("click", function() {

                $.post(Waves.server+'/addresses/', function(createAddress) {

                    Waves.loadWallet();

                });

            });


        });

    }

    //Import Waves Account

    $("#import_account").on("click", function(e) {
        e.preventDefault();

        $("#step2_reg").show();
        $("#walletSeed").val('');
        $("#publicKeyLockscreen").html('');
        $("#privateKeyLockscreen").html('');
        $("#addresLockscreen").html('');

    });

    //Create new Waves Acount

    $("#create_account").on("click", function(e) {
        e.preventDefault();

        $("#step2_reg").show();

        var passphrase = PassPhraseGenerator.generatePassPhrase();
        $("#walletSeed").val(passphrase);

        var publicKey = Waves.getPublicKey(passphrase);
        var privateKey = Waves.getPrivateKey(passphrase);

        $("#publicKeyLockscreen").html(publicKey);
        $("#privateKeyLockscreen").html(privateKey);

        Waves.apiRequest(Waves.api.waves.address, publicKey, function(response) {
            $("#addresLockscreen").html(response.address);
        });

    });


    $("#generateKeys").on("click", function(e) {
        e.preventDefault();

        var walletSeed = $("#walletSeed").val();

        var publicKey = Waves.getPublicKey(walletSeed);
        var privateKey = Waves.getPrivateKey(walletSeed);

        $("#publicKeyLockscreen").html(publicKey);
        $("#privateKeyLockscreen").html(privateKey);

        Waves.apiRequest(Waves.api.waves.address, publicKey, function(response) {
            $("#addresLockscreen").html(response.address);
        });


    });

    $("#generateRandomSeed").on("click", function(e) {
        e.preventDefault();

        var passphrase = PassPhraseGenerator.generatePassPhrase();
        $("#walletSeed").val(passphrase);

        var publicKey = Waves.getPublicKey(passphrase);
        var privateKey = Waves.getPrivateKey(passphrase);

        $("#publicKeyLockscreen").html(publicKey);
        $("#privateKeyLockscreen").html(privateKey);

        Waves.apiRequest(Waves.api.waves.address, publicKey, function(response) {
            $("#addresLockscreen").html(response.address);
        });
    });

    $("#registerSeed").on("click", function(e) {
        e.preventDefault();

        var passphrase = $("#walletSeed").val();
        var publicKey = $("#publicKeyLockscreen").html();
        var privateKey = $("#privateKeyLockscreen").html();
        var address = $("#addresLockscreen").html();

        var accountData = {
            passphrase: passphrase,
            publicKey: publicKey,
            privateKey: privateKey,
            address: address
        };


        if(Waves.hasLocalStorage) {

            var currentAccounts = localStorage.getItem('WavesAccounts');
                currentAccounts = JSON.parse(currentAccounts);

            if(currentAccounts !== undefined && currentAccounts !== null) {

                currentAccounts.accounts.push(accountData);
                localStorage.setItem('WavesAccounts', JSON.stringify(currentAccounts));

            } else {
                var accountArray = { accounts: [accountData] };
                localStorage.setItem('WavesAccounts', JSON.stringify(accountArray));
            }
        }

    });

    Waves.loadAddressBalance = function (address, callback) {

        Waves.apiRequest(Waves.api.address.balance(address), function(response) {
            return callback(response.balance);
        })

    }

    Waves.login = function (accountDetails) {


        Waves.loadBlockheight();
        Waves.seed = accountDetails.passphrase;
        Waves.publicKey = accountDetails.publicKey;
        Waves.privateKey = accountDetails.privatekey;
        Waves.address = accountDetails.address;

        Waves.loadAddressBalance(Waves.address, function (balance) {

            $("#lockscreen").hide();
            $("#lockscreenTable").hide();
            $("#wrapper").show();

            $("#wavesbalance").html(balance);
            $("#balancespan").html(balance +' Waves');
            $('.balancewaves').html(balance + ' Waves');
            $(".wB-add").html(Waves.address);
            
        });
    }

    

	return Waves;
}(Waves || {}, jQuery));    




$(document).ready(function(){

    Waves.initApp();

    if(Waves.hasLocalStorage) {
       var userAccounts = localStorage.getItem('WavesAccounts');

       if(userAccounts !== null) {
            var accounts = JSON.parse(userAccounts);

            $.each(accounts.accounts, function(accountKey, accountDetails) {

                $("#wavesAccounts").append('<br>'+accountDetails.address+' <button class="loginAccount" data-id="'+accountKey+'">Login</button>');

            });

       }

       $(".loginAccount").on("click", function(e) {
            e.preventDefault();

            var accountId = $(this).data('id');

            var userAccounts = localStorage.getItem('WavesAccounts');

           if(userAccounts !== null) {
                var accounts = JSON.parse(userAccounts);

                var accountDetails = accounts.accounts[accountId];
                
                Waves.login(accountDetails);

           }


        });

    } else {

        //To Do: no LocalStorage

    }

});







