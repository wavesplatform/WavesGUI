/******************************************************************************
 * Copyright © 2016 The Waves Developers.                                *
 *                                                                            *
 * See the LICENSE files at                                                   *
 * the top-level directory of this distribution for the individual copyright  *
 * holder information and the developer policies on copyright and licensing.  *
 *                                                                            *
 * Unless otherwise agreed in a custom licensing agreement, no part of the    *
 * Waves software, including this file, may be copied, modified, propagated,  *
 * or distributed except according to the terms contained in the LICENSE      *
 * file.                                                                      *
 *                                                                            *
 * Removal or modification of this copyright notice is prohibited.            *
 *                                                                            *
 ******************************************************************************/
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

    Waves.balance  = 0;
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

        if(Waves.hasLocalStorage) {
           var userAccounts = localStorage.getItem('WavesAccounts');

           if(userAccounts !== null) {
                var accounts = JSON.parse(userAccounts);

                $.each(accounts.accounts, function(accountKey, accountDetails) {

                    var accountName = '';
                    if(accountDetails.name !== undefined) {
                        accountName = accountDetails.name;
                    }

                    $("#wavesAccounts").append('<p class="loginAccountDiv"><br><b>'+accountName+'</b> <small>'+accountDetails.address+'</small> &nbsp; <button class="removeAccount wButtonAlt fade" data-id="'+accountKey+'"><span class="wButton-icon"><img src="img/wIcon_x.svg"></span>REMOVE</button> <button class="loginAccount wButtonAlt fade" data-id="'+accountKey+'"><span class="wButton-icon"><img src="img/wIcon_go.svg"></span>LOG IN</button></p> ');

                });

           }

           $(".loginAccount").on("click", function(e) {
                e.preventDefault();

                var accountId = $(this).data('id');

                var userAccounts = localStorage.getItem('WavesAccounts');

               if(userAccounts !== null) {
                    var accounts = JSON.parse(userAccounts);

                    var accountDetails = accounts.accounts[accountId];

                    var childNode = accountId + 1;

                    $("#loginAccountDiv").remove();

                    var submitButton = '<button class="submitLoginAccount wButton fade">SUBMIT</button>';

                    $("#wavesAccounts > p:nth-child("+childNode+")").after("<div id='loginAccountDiv'>PASSWORD&nbsp;&nbsp;<input type='password' id='loginPassword' class='wInput'><br/>"+submitButton+"<br/><div id='errorPasswordLogin'></div></div>");

                    $(".submitLoginAccount").on("click", function() {

                        var password = $("#loginPassword").val();

                        var decryptPassword = Waves.decryptWalletSeed(accountDetails.cipher, password, accountDetails.checksum);

                        if(decryptPassword) {
                            accountDetails.passphrase = decryptPassword;

                            var publicKey = Waves.getPublicKey(decryptPassword);
                            var privateKey = Waves.getPrivateKey(decryptPassword);
                            accountDetails.publicKey = publicKey;
                            accountDetails.privateKey = privateKey;
                            Waves.login(accountDetails);
                            $("#errorPasswordLogin").html('');
                        } else {
                           
                           $("#errorPasswordLogin").html('Wrong password');

                        }

                    });

               }

            });

           $(".removeAccount").on("click", function(e) {
                e.preventDefault();

                var accountId = $(this).data('id');

                var userAccounts = localStorage.getItem('WavesAccounts');

                if(userAccounts !== null) {
                    var accounts = JSON.parse(userAccounts);

                    if (accountId > -1) {
                        accounts.accounts.splice(accountId, 1);
                    }

                    localStorage.setItem('WavesAccounts', JSON.stringify(accounts));

                    $("#wavesAccounts").html('');
                    location.reload();
                }
           });

        } else {

            //no LocalStorage support
            $("#wavesAccounts").html('Your Browser does not support Storage, if you create an account please carefully backup your userdata.')

        }

    }

    Waves.loadBlockheight = function () {

        Waves.apiRequest(Waves.api.blocks.height, function(result) {
            
            $("#blockheight").html(result.height);

        });

    }

    Waves.loadBalance = function () {

        Waves.apiRequest(Waves.api.address.getAddresses(), function(response) {

            var account = 0;

            $.each(response, function(key, value) {


                Waves.apiRequest(Waves.api.address.balance(value), function(balanceResult) {

                    Waves.balance = Waves.balance + balanceResult.balance;

                    $("#wavesbalance").html(Waves.balance)

                    $("#balancespan").html(Waves.balance +' Waves');

                    $('.balancewaves').html(Waves.balance + ' Waves');

                });

            });
        });

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

        console.log('PrivateKey Generated: '+privateKey);
        console.log('PublicKey Generated: '+publicKey);

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
        console.log('PrivateKey Generated: '+privateKey);
        console.log('PublicKey Generated: '+publicKey);

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
        console.log('PrivateKey Generated: '+privateKey);
        console.log('PublicKey Generated: '+publicKey);

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
        var name = $("#walletName").val();
        var password = $("#walletPassword").val();
        var passwordConfirm = $("#walletPasswordConfirm").val();

        if(password !== passwordConfirm) {
            $("#errorRegister").html('Your passwords do not match.');
            return;
        }

        var cipher = Waves.encryptWalletSeed(passphrase, password).toString();
        var checksum = converters.byteArrayToHexString(Waves.simpleHash(converters.stringToByteArray(passphrase)));

        
        var accountData = {
            name: name,
            cipher: cipher,
            checksum: checksum,
            publicKey: publicKey,
            address: address
        };

        if(Waves.hasLocalStorage) {

            var currentAccounts = localStorage.getItem('WavesAccounts');
                currentAccounts = JSON.parse(currentAccounts);

            if(currentAccounts !== undefined && currentAccounts !== null) {

                currentAccounts.accounts.push(accountData);
                localStorage.setItem('WavesAccounts', JSON.stringify(currentAccounts));
                $("#wavesAccounts").append('<br><b>'+accountData.name+'</b> '+accountData.address);

            } else {
                var accountArray = { accounts: [accountData] };
                localStorage.setItem('WavesAccounts', JSON.stringify(accountArray));
                $("#wavesAccounts").append('<br><b>'+accountData.name+'</b>'+accountData.address);
            }

        }

        accountData.firstTime = true;
        accountData.password = password;
        accountData.passphrase = passphrase;
        passphrase = '';

        Waves.login(accountData);
        
    });

    Waves.loadAddressBalance = function (address, callback) {

        Waves.apiRequest(Waves.api.address.balance(address), function(response) {
            return callback(response.balance);
        });

    }

    Waves.getAddressHistory = function(address, callback) {

        Waves.apiRequest(Waves.api.transactions.forAddress(address), function(response) {
            return callback(response);
        });

    }

    Waves.login = function (accountDetails) {

        Waves.loadBlockheight();
        Waves.passphrase = accountDetails.passphrase;
        Waves.publicKey = accountDetails.publicKey;
        Waves.privateKey = accountDetails.privateKey;
        Waves.address = accountDetails.address;
        Waves.cipher = accountDetails.cipher;
        Waves.password = accountDetails.password;
        Waves.checksum = accountDetails.checksum

        Waves.loadAddressBalance(Waves.address, function (balance) {

            $("#lockscreen").hide();
            $("#lockscreenTable").hide();
            $("#wrapper").show();

            $("#wavesbalance").html(balance);
            $("#balancespan").html(balance +' Waves');
            $('.balancewaves').html(balance + ' Waves');
            $(".wB-add").html(Waves.address);
            $("#wavesAccountAddress").html(Waves.address);

            Waves.getAddressHistory(Waves.address, function(history) {

                var transactionHistory = history[0];
                var appContainer;

                 $.each(transactionHistory, function(historyKey, historyValue) {

                        appContainer += '<tr>';
                        appContainer += '<td>'+Waves.formatTimestamp(historyValue.timestamp)+'</td>';
                        appContainer += '<td>'+historyValue.type+'</td>';
                        appContainer += '<td>'+historyValue.sender+'</td>';
                        appContainer += '<td>'+historyValue.recipient+'</td>';
                        appContainer += '<td>'+historyValue.fee+'</td>';
                        appContainer += '<td>'+historyValue.amount+' Waves</td>';
                        appContainer += '</tr>';

                });

                $("#transactionhistory").html(appContainer);

            
            });
               
        });
    }

    $("#wavessend").on("click", function(e) {
        e.preventDefault();

        var sendAmount = $("#wavessendamount").val().replace(/\s+/g, '');
        var amount = Number(sendAmount);

        var sender = Base58.decode(Waves.privateKey);
        var recipient = $("#wavesrecipient").val().replace(/\s+/g, '');

        var wavesTime = Waves.getTime();

        var signature;
        var fee = 1;

        var signatureData = Waves.signatureData(sender, recipient, amount, fee, wavesTime);

        var signature = Waves.signBytes(sender, signatureData, true);

        signature = Base58.encode(signature,Waves.MAP)

        var data = {
          "recipient": recipient,
          "timestamp": wavesTime,
          "signature": signature,
          "amount": amount,
          "senderPublicKey": Waves.publicKey,
          "fee": fee
        }

        //console.log(data);

        Waves.apiRequest(Waves.api.waves.broadcastTransaction, JSON.stringify(data), function(response) {

            console.log(response);

            $("#sentpayment").html(JSON.stringify(data));

            $("#errorpayment").html(JSON.stringify(response));

        });

        //console.log(data);

    });

    $("#addContact").on("click", function(e) {
        e.preventDefault();

        $("#contactForm").toggle();
    });

    $("#addContactSubmit").on("click", function(e) {
        e.preventDefault();

        var name = $("#contactname").val();
        var address = $("#contactaddress").val();
        var email = $("#contactemail").val();

        var accountData = {
            name: name,
            address: address,
            email: email
        };

        if(Waves.hasLocalStorage) {

            var currentAccounts = localStorage.getItem('WavesContacts');
                currentAccounts = JSON.parse(currentAccounts);

            if(currentAccounts !== undefined && currentAccounts !== null) {

                currentAccounts.contacts.push(accountData);
                localStorage.setItem('WavesContacts', JSON.stringify(currentAccounts));
                var row = Waves.contactRow(accountData);
                $("#contactTable").append(row);

            } else {

                var accountArray = { contacts: [accountData] };
                localStorage.setItem('WavesContacts', JSON.stringify(accountArray));
                var row = Waves.contactRow(accountData);
                $("#contactTable").append(row);
            }

        }

    });


    $("#tabs-Icons-community").on("click", function(e) {

        var currentAccounts = localStorage.getItem('WavesContacts');
            currentAccounts = JSON.parse(currentAccounts);

        var row;
        $.each(currentAccounts.contacts, function(contactKey, contactData) {
            
            row += Waves.contactRow(contactData);
    
        });

        $("#contactTable").html(row);

    });


    Waves.contactRow = function (accountArray) {

        var row = '<tr>';

        row += '<td>'+accountArray.name+'</td>';
        row += '<td>'+accountArray.address+'</td>';
        row += '<td>'+accountArray.email+'</td>';
        row += '<td>Send Message Remove</td>';

        row += '</tr>';

        return row;

    };

	return Waves;
}(Waves || {}, jQuery));


$(document).ready(function(){

    Waves.initApp();
    $('.tooltip').tooltipster();

});







