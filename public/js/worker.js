(function(self) {
  function sha1(e){function k(b,c){return b<<c|b>>>32-c}function m(b){var c="",d,e;for(d=7;0<=d;d--)e=b>>>4*d&15,c+=e.toString(16);return c}var b,d,i=Array(80),n=1732584193,p=4023233417,q=2562383102,r=271733878,s=3285377520,c,g,h,j,l;b=e.replace(/\r\n/g,"\n");for(var f="",e=0;e<b.length;e++)d=b.charCodeAt(e),128>d?f+=String.fromCharCode(d):(127<d&&2048>d?f+=String.fromCharCode(d>>6|192):(f+=String.fromCharCode(d>>12|224),f+=String.fromCharCode(d>>6&63|128)),f+=String.fromCharCode(d&63|128));e=f;
  c=e.length;f=[];for(b=0;b<c-3;b+=4)d=e.charCodeAt(b)<<24|e.charCodeAt(b+1)<<16|e.charCodeAt(b+2)<<8|e.charCodeAt(b+3),f.push(d);switch(c%4){case 0:b=2147483648;break;case 1:b=e.charCodeAt(c-1)<<24|8388608;break;case 2:b=e.charCodeAt(c-2)<<24|e.charCodeAt(c-1)<<16|32768;break;case 3:b=e.charCodeAt(c-3)<<24|e.charCodeAt(c-2)<<16|e.charCodeAt(c-1)<<8|128}for(f.push(b);14!=f.length%16;)f.push(0);f.push(c>>>29);f.push(c<<3&4294967295);for(e=0;e<f.length;e+=16){for(b=0;16>b;b++)i[b]=f[e+b];for(b=16;79>=
  b;b++)i[b]=k(i[b-3]^i[b-8]^i[b-14]^i[b-16],1);d=n;c=p;g=q;h=r;j=s;for(b=0;19>=b;b++)l=k(d,5)+(c&g|~c&h)+j+i[b]+1518500249&4294967295,j=h,h=g,g=k(c,30),c=d,d=l;for(b=20;39>=b;b++)l=k(d,5)+(c^g^h)+j+i[b]+1859775393&4294967295,j=h,h=g,g=k(c,30),c=d,d=l;for(b=40;59>=b;b++)l=k(d,5)+(c&g|c&h|g&h)+j+i[b]+2400959708&4294967295,j=h,h=g,g=k(c,30),c=d,d=l;for(b=60;79>=b;b++)l=k(d,5)+(c^g^h)+j+i[b]+3395469782&4294967295,j=h,h=g,g=k(c,30),c=d,d=l;n=n+d&4294967295;p=p+c&4294967295;q=q+g&4294967295;r=r+h&4294967295;
  s=s+j&4294967295}return(m(n)+m(p)+m(q)+m(r)+m(s)).toLowerCase()};

  self.addEventListener('message', function(e) {
    var nonce = e.data,
        x = ~~(Math.random() * 1e9);

    while (true) {
      var hash = sha1(nonce + ':' + x);
      if (/000000/.test(hash)) break;
      x++;
    }
    self.postMessage(x);
  });
})(self);
