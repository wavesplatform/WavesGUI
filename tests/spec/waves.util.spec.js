describe("waves.util", function() {

	function keyGenerationTestCase(encodedSeed, encodedExpectedPrivateKey, encodedExpectedPublicKey) {
		var seedBytes = Base58.decode(encodedSeed);
		var privateKey = Waves.buildPrivateKey(seedBytes);
		var publicKey = Waves.buildPublicKey(seedBytes);

		expect(privateKey).toEqual(encodedExpectedPrivateKey);
		expect(publicKey).toEqual(encodedExpectedPublicKey);
	}

	function hashingTestCase(encodedNoncedSeed, encodedExpectedHash) {
		var seedBytes = Base58.decode(encodedNoncedSeed);
		var hashBytes = Waves.hashChain(seedBytes);

		expect(Base58.encode(hashBytes)).toEqual(encodedExpectedHash);
	}

	it("should correctly convert long to byte array", function() {
		expect(Waves.longToByteArray(1)).toEqual([0,0,0,0,0,0,0,1]);
		expect(Waves.longToByteArray(12312)).toEqual([0, 0, 0, 0, 0, 0, 48, 24]);
	});
  
  it("generates correct private and public keys", function(){
	  keyGenerationTestCase("sfRTzgCRLuWEbYBtnmnt7DecxvKazTMEScJpnFWaacCFWy36E83iGR8F6bKrQtwc2yuKmKo1vQBV8cFca4K8eoy",
	  	"YoLY4iripseWvtMt29sc89oJnjxzodDgQ9REmEPFHkK",
	  	"3qTkgmBYFjdSEtib9C4b3yHiEexyJ59A5ZVjSvXsg569");
	  keyGenerationTestCase("QJLRHJVdAAxSucSzaBtDBhGDNiehe61vpFdHongK88jBa6ckZz5a57Hbb8PKtBL26dgAkJpsrX7Z9LT6egX2XAz",
		  "EVLXAcnJgnV1KUJasidEY4myaKwvh2d3p8CPc6srC32A",
		  "7CPECZ633JRSM39HrB8axeJMZWixBeo2p9bWfwwVAhYj");
	  keyGenerationTestCase("3bMpEZd31VLXnrFsPsqSANWzkHvkzwZ6GzGvMHZri7zUGkZuQbe9MQF86K1pkB36oy9LMQNfoXNsQhHzv1VMj7TF",
		  "98JtkrkqGqunaJqtN7J2kvJeUnvrTkpobDVArGXTVFa1",
		  "FKKmKKWsVBPFWufcTTJjoQZDjMG9jmgzAbFPjQm9DVj8");
  });
	
	it("generates expected hash for a predefined seed", function () {
		hashingTestCase("aVYPRLnqyyV367BssHsKUnkRgXXQYJcxSMgCuzZBBSD7ELnCzvMNmNKcjySu8fjYcERZCzvjqir5n2eCavh9oy4q4ro8B",
			"Cyw5mgkYiAsCKvKZveGvAD9bjNconFUduJDBLvTGAFXS");
		hashingTestCase("aVYPRLKUtvmfPK19KWBPjtXqmrbt9u2kmUKqagvpVuEeQ5KjXrQWM2fUmqFbJ2E5fhtqbQzPcZq4otaKWzht1T9TGkfVC",
			"Be8depGda1e9d5BVYJ55YXZmvRZTezaBTHHyJpmpqPgy");
		hashingTestCase("aVYPRNWYNk3yvhLJtr83AHqVKonhtRwxsmdJf36qnxiRaUKbGfRWTeJg3jGLLhFQGXaGhHiggxhKXrwU5ZQZVTkomhtaC",
			"5Afu7yvvwckWDabWG3LHFqLMBHy8uoyxiVahdNo39rp9");
	});
});
