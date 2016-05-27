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

 //Import Waves Account

    $("#import_account").on("click", function(e) {
        e.preventDefault();

        $("#import_account").hide();
        $("#create_account").hide();
        $("#ImportAccHeader").show();
        $("#AccHeader").hide();
        $("#wavesAccounts").addClass('noDisp');

        $("#step2_reg").show();
        $("#walletSeed").val('');
        $("#publicKeyLockscreen").html('');
        $("#privateKeyLockscreen").html('');
        $("#addresLockscreen").html('');

    });

    //Create new Waves Acount
    $("#create_account").on("click", function(e) {
        e.preventDefault();

        $("#import_account").hide();
        $("#create_account").hide();
        $("#generateKeys").hide();
        $("#account_divider").hide();
        $("#AccHeader").hide();
        $("#NewAccHeader").show();
        $("#wavesAccounts").addClass('noDisp');

        $("#step2_reg").show();
        $("#login-wPop-new").modal("show");

        var passphrase = PassPhraseGenerator.generatePassPhrase();
        $("#walletSeed").val(passphrase);

        var publicKey = Waves.getPublicKey(passphrase);
        var privateKey = Waves.getPrivateKey(passphrase);

        $("#publicKeyLockscreen").html(publicKey);
        $("#privateKeyLockscreen").html(privateKey);

        //console.log('PrivateKey Generated: '+privateKey);
        //console.log('PublicKey Generated: '+publicKey);

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
        //console.log('PrivateKey Generated: '+privateKey);
        //console.log('PublicKey Generated: '+publicKey);

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
        //console.log('PrivateKey Generated: '+privateKey);
        //console.log('PublicKey Generated: '+publicKey);

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

        } else {

            var accountArray = { accounts: [accountData] };
            chrome.storage.sync.set({'WavesAccounts': accountArray}, function() {
                // Notify that we saved.
                console.log(accountArray);
                $.growl.notice({ message: "Added Account!" });
                $("#wavesAccounts").append('<br><b>'+accountData.name+'</b> '+accountData.address);
            });

            /*

            chrome.storage.local.get('WavesAccounts', function (currentAccounts) {

                console.log(currentAccounts);

                if(currentAccounts !== undefined && currentAccounts !== null) {

                    currentAccounts.accounts.push(accountData);
                    chrome.storage.sync.set({'WavesAccounts': currentAccounts}, function() {
                        // Notify that we saved.
                        $.growl.notice({ message: "Added Account!" });
                        $("#wavesAccounts").append('<br><b>'+accountData.name+'</b> '+accountData.address);
                    });

                } else {
                    var accountArray = { accounts: [accountData] };
                    chrome.storage.sync.set({'WavesAccounts': accountArray}, function() {
                        // Notify that we saved.
                        $.growl.notice({ message: "Added Account!" });
                        $("#wavesAccounts").append('<br><b>'+accountData.name+'</b> '+accountData.address);
                    });
                }
                
                
            });
                */
           
        }

        accountData.firstTime = true;
        accountData.password = password;
        accountData.passphrase = passphrase;
        passphrase = '';

        Waves.login(accountData);
        
    });

    return Waves;
}(Waves || {}, jQuery));
