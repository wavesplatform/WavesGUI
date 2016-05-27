/******************************************************************************
 * Copyright © 2016 The Waves Developers.                                     *
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
 * @depends {3rdparty/big.js}
 * @depends {3rdparty/jsbn.js}
 * @depends {3rdparty/jsbn2.js}
 * @depends {3rdparty/webdb.js}
 * @depends {3rdparty/jquery.growl.js}
 * @depends {3rdparty/clipboard.js}
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


    Waves.setInitApp = function (userAccounts) {

        if(userAccounts !== null) {
                var accounts = JSON.parse(userAccounts);

                $.each(accounts.accounts, function(accountKey, accountDetails) {

                    var accountName = '';
                    if(accountDetails.name !== undefined) {
                        accountName = accountDetails.name;
                    }
                    
                    $("#wavesAccounts").append('<p class="loginAccountDiv"><span class="loginAccount tooltip-1 fade" title="Log into this account." data-id="'+accountKey+'"> <br/> <b>'+accountName+'</b> &nbsp;  <small>'+accountDetails.address+'</small></span><span class="clipSpan tooltip-1" title="Copy this address to the clipboard." data-clipboard-text="'+accountDetails.address+'"></span> &nbsp;&nbsp; <button class="removeAccount wButtonAlt fade tooltip-1" title="Remove this account from the list." data-id="'+accountKey+'"><span class="wButton-icon"><img src="img/wIcon_x.svg"></span>REMOVE</button></p> ');

                });

           }

           $(".loginAccount").on("click", function(e) {
                e.preventDefault();

                $("#import_account").hide();
                $("#create_account").hide();
                var accountId = $(this).data('id');
                $('.loginAccountDiv').hide();
                $(this).parent().show();
                $("#register").css("display", "none");

                var userAccounts = localStorage.getItem('WavesAccounts');

               if(userAccounts !== null) {
                    var accounts = JSON.parse(userAccounts);

                    var accountDetails = accounts.accounts[accountId];

                    var childNode = accountId + 1;

                    $("#loginAccountDiv").remove();

                    var submitButton = '<button class="submitLoginAccount wButton fade">SUBMIT</button>';
                    var backButton = '<button class="goBack wButton fade tooltip-1" title="Return to the previous step.">BACK</button>';

                    $("#wavesAccounts > p:nth-child("+childNode+")").after("<div id='loginAccountDiv'>PASSWORD<br/><input type='password' id='loginPassword' class='wInput' autofocus><br/>"+submitButton+" "+backButton+" <br/><div id='errorPasswordLogin' style='display: none;'></div></div>");

                     $(".goBack").on("click", function(e) {
                        e.preventDefault();
                        location.reload();
                    });

                    $("#loginPassword").on("keyup", function(e) {

                        if(Waves.isEnterKey(e.keyCode)) {
                            
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

                                $.growl.error({ message: "Wrong password! Please try again." });

                            }
                        }

                    });

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
                            $.growl.error({ message: "Wrong password! Please try again." });
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


                     $("#login-wPop-remove").modal({
                      fadeDuration: 500,
                      fadeDelay: 0.10
                    });

                    $("#remove_account_confirmation").on("click", function() {

                        if (accountId > -1) {
                            accounts.accounts.splice(accountId, 1);
                        }

                        localStorage.setItem('WavesAccounts', JSON.stringify(accounts));

                        $("#wavesAccounts").html('');
                        location.reload();
                    });

                    $("#remove_account_cancel").on("click", function(){
                        accounts = '';
                        userAccounts = '';
                        $.modal.close();
                    });
                    

                }
           });


    }




	//To DO: Extract DOM functions from the initApp and add to waves.ui.js
	Waves.initApp = function () {

        if (!_checkDOMenabled()) {
            Waves.hasLocalStorage = false;
        } else {
            Waves.hasLocalStorage = true;
       }

        $("#wrapper").hide();
        $("#lockscreen").fadeIn('1000');
        $("#lockscreenTable").fadeIn('1000');

        if(Waves.hasLocalStorage) {
           var userAccounts = localStorage.getItem('WavesAccounts');

           Waves.setInitApp(userAccounts);

        } else {

            //no LocalStorage support
            //$("#wavesAccounts").html('Your Browser does not support Storage, if you create an account please carefully backup your userdata.')


            chrome.storage.local.get('WavesAccounts', function (result) {
                
                console.log(result);

                Waves.setInitApp(result);


            });

        }

    }

    Waves.loadBlockheight = function () {

        Waves.apiRequest(Waves.api.blocks.height, function(result) {
            
            Waves.blockHeight = result.height;
            $("#blockheight").html(result.height);

        });

    }

    Waves.loadBalance = function () {

        Waves.apiRequest(Waves.api.address.getAddresses(), function(response) {

            var account = 0;

            $.each(response, function(key, value) {


                Waves.apiRequest(Waves.api.address.balance(value), function(balanceResult) {

                    Waves.balance = Waves.balance + balanceResult.balance;

                    $("#wavesCurrentBalance").val(Waves.formatAmount(Waves.balance));

                    $("#balancespan").html(Waves.formatAmount(Waves.balance) +' Waves');

                    $('.balancewaves').html(Waves.formatAmount(Waves.balance) + ' Waves');

                });

            });
        });

    }

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
        Waves.checksum = accountDetails.checksum;

        $("#wavesAccountAddress").html('<span class="clipSpan" id="wavesAccountAddressClip" data-clipboard-text="'+Waves.address+'" style="cursor: pointer; cursor: hand;">'+Waves.address+'</span>')

        Waves.loadAddressBalance(Waves.address, function (balance) {

            $("#lockscreen").fadeOut(500);
            $("#lockscreenTable").fadeOut(500);
            $("#wrapper").fadeIn(1300);

			var formatBalance = Waves.formatAmount(balance);
            $("#wavesCurrentBalance").val(formatBalance);
            $("#wavesbalance").html(formatBalance.split(".")[0]);
            $("#wavesbalancedec").html('.'+formatBalance.split(".")[1]);
            $("#balancespan").html(formatBalance +' Waves');
            $('.balancewaves').html(formatBalance + ' Waves');
            //$(".wB-add").html(Waves.address);
            //$("#wavesAccountAddress").html(Waves.address);

            Waves.updateDOM('mBB-wallet');

            
               
        });
    }

    Waves.contactRow = function (accountArray) {

        var row = '<tr>';

        row += '<td>'+accountArray.name+'</td>';
        row += '<td>'+accountArray.address+'</td>';
        row += '<td>'+accountArray.email+'</td>';
        row += '<td>Send Message Remove</td>';

        row += '</tr>';

        return row;

    };

    Waves.logout = function () {
        Waves = '';
        window.location.href = window.location.pathname;  
        chrome.runtime.reload();
    }


    Waves.formatAmount = function (amount) {

    	return new Decimal(amount).dividedBy(100000000).toFixed(8);

    }

	return Waves;
}(Waves || {}, jQuery));