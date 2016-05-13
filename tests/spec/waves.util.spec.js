describe("waves.util", function() {


 it("should correctly convert long to byte array", function() {
	 
	 expect(Waves.longToByteArray(1)).toEqual([0,0,0,0,0,0,0,1]);
	 expect(Waves.longToByteArray(12312)).toEqual([0, 0, 0, 0, 0, 0, 48, 24]);
  });
  
  it("generates correct private and public keys", function(){
	  
		//"secretPhrase877282999374"
		
	  var publicKey = Waves.getPublicKey(seed);
	  expect(publicKey).toEqual("HGsmhwkdoLzKtAQVePcSr75Pj25dVMf8RPE4CzbCPVXi");
	  
	  var privateKey = Waves.getPrivateKey(seed);
	  expect(privateKey).toEqual("Hkn4PnmBgnyg59qsunBB4V4xhf5bobVdPWQvC3f5L3YZ");
  });
});
