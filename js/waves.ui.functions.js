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

        switch(Waves.network) {
            case 'devel':
            case 'testnet':
                $(".testnet").removeClass('noDisp');
                $(".mainnet").addClass('noDisp');
                break;
            default:
                $(".testnet").addClass('noDisp');
                $(".mainnet").removeClass('noDisp');
            break;
        }

        if(userAccounts !== null && userAccounts !== undefined) {
                
            var accounts;
            if(Waves.hasLocalStorage) {
                accounts = JSON.parse(userAccounts);
            } else {
                accounts = userAccounts;
                console.log(accounts);
            }

            $.each(accounts.accounts, function(accountKey, accountDetails) {

                var accountName = '';
                if(accountDetails.name !== undefined) {
                    accountName = accountDetails.name;
                }

                try {
                    var accountAddress = Waves.Addressing.fromRawAddress(accountDetails.address).getDisplayAddress();
                    $("#wavesAccounts").append('<p class="loginAccountDiv"><span class="loginAccount tooltip-1 fade" title="Log into this account." data-id="' + accountKey + '"> <br/> <b>' + accountName + '</b> <span class="divider-1"></span> <small>' + accountAddress + '</small></span><span class="clipSpan tooltip-1" title="Copy this address to the clipboard." data-clipboard-text="' + accountAddress + '"></span> <span class="divider-1"></span> <button class="removeAccount wButtonAlt fade tooltip-1" title="Remove this account from the list." data-id="' + accountKey + '"><span class="wButton-icon"><img src="img/wIcon_x.svg"></span>REMOVE</button></p> ');
                }
                catch (e) {
                    console.log('Skipping account: ' + accountName);
                }
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

           if(userAccounts !== null) {
                
                var accounts;
                if(Waves.hasLocalStorage) {
                    accounts = JSON.parse(userAccounts);
                } else {
                    accounts = userAccounts;
                }

                var accountDetails = accounts.accounts[accountId];

                $("#loginAccountDiv").remove();

                var submitButton = '<button class="submitLoginAccount wButton fade">SUBMIT</button>';
                var backButton = '<button class="goBack wButton fade tooltip-1" title="Return to the previous step.">BACK</button>';
                var divider2 = '<span class="divider-2"></span>';

               $(this).parent().after("<div id='loginAccountDiv'>PASSWORD<br/><input type='password' id='loginPassword' class='wInput' autofocus><br/>"+submitButton+""+divider2+""+backButton+"<br/><div id='errorPasswordLogin' style='display: none;'></div></div>");

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

            if(userAccounts !== null) {
                var accounts;

                if(Waves.hasLocalStorage) {
                    accounts = JSON.parse(userAccounts);
                } else {
                    accounts = userAccounts;
                }

                 $("#login-wPop-remove").modal({
                  fadeDuration: 500,
                  fadeDelay: 0.10
                });

                $("#remove_account_confirmation").on("click", function() {

                    if (accountId > -1) {
                        accounts.accounts.splice(accountId, 1);
                    }

                    if(Waves.hasLocalStorage) {
                        localStorage.setItem('Waves'+Waves.network, JSON.stringify(accounts));
                        // Notify that we saved.
                        $.growl.notice({ message: "Removed Account!" });
                    } else {
                        chrome.storage.sync.set({'WavesAccounts': accounts}, function() {
                            // Notify that we saved.
                            $.growl.notice({ message: "Removed Account!" });
                        });
                    }

                    $("#wavesAccounts").html('');
                    
                    if(Waves.hasLocalStorage) {
                        location.reload();
                    } else {
                        chrome.runtime.reload();
                    }
                });

                $("#remove_account_cancel").on("click", function(){
                    accounts = '';
                    userAccounts = '';
                    $.modal.close();
                });
                

            }
       });

    }


    Waves.getAccounts = function(callback) {

        chrome.storage.sync.get('WavesAccounts', function (result) {
                
            if($.isEmptyObject(result) === false) {
                callback(result);
            } else {
                callback('');
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
           var userAccounts = localStorage.getItem('Waves'+Waves.network);

           Waves.setInitApp(userAccounts);

        } else {

            Waves.getAccounts(function(userAccounts) {

                Waves.setInitApp(userAccounts['WavesAccounts']);
                
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
        Waves.address = Waves.Addressing.fromRawAddress(accountDetails.address);
        Waves.cipher = accountDetails.cipher;
        Waves.password = accountDetails.password;
        Waves.checksum = accountDetails.checksum;

        Waves.privateKey = Waves.getPrivateKey(accountDetails.passphrase);

        $("#wavesAccountAddress").html('<span class="clipSpan" id="wavesAccountAddressClip" data-clipboard-text="'+
            Waves.address.getDisplayAddress()+'" style="cursor: pointer; cursor: hand;">'+Waves.address.getDisplayAddress()+'</span>')

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

            Waves.updateDOM('mBB-wallet');

        });
    }

    Waves.contactRow = function (accountArray) {

        var row = '<tr>';

        row += '<td>'+accountArray.name+'</td>';
        row += '<td>'+Waves.Addressing.fromRawAddress(accountArray.address).getDisplayAddress()+'</td>';
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

    Waves.isControlKey = function (charCode) {
        if (charCode >= 32)
            return false;
        if (charCode === 10)
            return false;
        if (charCode === 13)
            return false;

        return true;
    }

	return Waves;
}(Waves || {}, jQuery));