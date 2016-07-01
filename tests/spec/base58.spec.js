describe("base58", function() {


 it("after decode->encode should have the original data", function() {
	 
	 expect(Base58.encode(Base58.decode('eRBWQTV4m1RwEfLtzrhyg3CMjWhpsPqAe')))
			 .toEqual('eRBWQTV4m1RwEfLtzrhyg3CMjWhpsPqAe');
  });
  
  it("should correclty decode base58 string to bytes array", function(){
	  
	  var decoded = Base58.decode('eRBWQTV4m1RwEfLtzrhyg3CMjWhpsPqAe');
	  var bytes = new Uint8Array([1, 154, 111, 104, 105, 163, 239, 25, 72, 17, 240, 65, 206, 120, 235, 129, 70, 16, 247, 248, 180, 109, 210, 38, 95]);
	  expect(decoded).toEqual(bytes);
  });
});

