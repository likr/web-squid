/*
 * jsDAP 1.0.0, a JavaScript OPeNDAP client.
 *
 * You can find the uncompressed source at:
 *
 *   http://jsdap.googlecode.com/svn/trunk/
 *
 * Copyright (c) 2007--2009 Roberto De Almeida
 */
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('6 1Q=[\'2c\',\'2N\',\'2v\',\'2b\',\'21\',\'2R\',\'2A\',\'2u\',\'2o\',\'1m\',\'12\',\'1Z\'];6 1X=[\'2Q\',\'2L\',\'2I\'];2x.13.1l=l(a){y(i=0,1D=5[i];i<5.G;1D=5[++i]){o(a==1D)p 16}p 1d};1w.13.3B=l(){p 5.1b(/^\\s+|\\s+$/g,\'\')};1w.13.2w=l(){p 5.1b(/^[\\s\\n\\r\\t]+/,\'\')};1w.13.3z=l(){p 5.1b(/\\s+$/,\'\')};l 1G(a){o(/^[,:{}\\[\\]0-9.\\-+3w-u \\n\\r\\t]*$/.1C(a.1b(/\\\\./g,\'@\').1b(/"[^"\\\\\\n\\r]*"/g,\'\'))){p 3o(\'(\'+a+\')\')}p a}l X(a){5.P=a;5.R={}}l 1A(c){5.O=c;5.C=l(b){6 a=A 1Y(\'^\'+b,\'i\');m=5.O.1k(a);o(m){p m[0]}q{p\'\'}};5.k=l(b){6 a=A 1Y(\'^\'+b,\'i\');m=5.O.1k(a);o(m){5.O=5.O.1S(m[0].G).2w();p m[0]}q{3I A 3G("3D 3C 14 O: "+5.O.1S(0,10));}}}l 1u(e){5.O=5.2G=e;5.2D=l(){6 c=A X(\'2I\');5.k(\'S\');5.k(\'{\');F(!5.C(\'}\')){6 d=5.1s();c[d.H]=d}5.k(\'}\');c.1a=c.H=5.k(\'[^;]+\');5.k(\';\');l 1K(a,b){y(2s Y a){J=a[2s];o(J.P){J.1a=J.H;o(b){J.1a=a.1a+\'.\'+J.1a}1K(J,16)}}}1K(c,1d);p c};5.14=5.2D;5.1s=l(){6 a=5.C(\'\\\\w+\').T();2p(a){L\'1F\':p 5.2m();L\'1E\':p 5.2k();L\'1z\':p 5.2h();3t:p 5.1i()}};5.1i=l(){6 a=A X();a.P=5.k(\'\\\\w+\');a.H=5.k(\'\\\\w+\');a.2f=[];a.18=[];F(!5.C(\';\')){5.k(\'\\\\[\');1j=5.k(\'\\\\w+\');o(5.C(\'=\')){a.2f.I(1j);5.k(\'=\');1j=5.k(\'\\\\d+\')}a.18.I(3j(1j));5.k(\'\\\\]\')}5.k(\';\');p a};5.2m=l(){6 a=A X(\'28\');5.k(\'1F\');5.k(\'{\');5.k(\'19\');5.k(\':\');a.19=5.1i();5.k(\'Q\');5.k(\':\');a.Q={};F(!5.C(\'}\')){6 b=5.1i();a.Q[b.H]=b}5.k(\'}\');a.H=5.k(\'\\\\w+\');5.k(\';\');p a};5.2h=l(){6 a=A X(\'2Q\');5.k(\'1z\');5.k(\'{\');F(!5.C(\'}\')){6 b=5.1s();a[b.H]=b}5.k(\'}\');a.H=5.k(\'\\\\w+\');5.k(\';\');p a};5.2k=l(){6 a=A X(\'2L\');5.k(\'1E\');5.k(\'{\');F(!5.C(\'}\')){6 b=5.1s();a[b.H]=b}5.k(\'}\');a.H=5.k(\'\\\\w+\');5.k(\';\');p a}}1u.13=A 1A;l 1R(h,j){5.O=5.24=h;5.S=j;5.14=l(){5.B=5.S;5.k(\'R\');5.k(\'{\');F(!5.C(\'}\')){5.1o()}5.k(\'}\');p 5.S};5.1o=l(){o(1Q.1l(5.C(\'\\\\w+\').T())){5.1J(5.B.R);o(5.B.P==\'28\'){y(a Y 5.B.Q){o(5.S[a]){6 a=5.B.Q[a];y(H Y a.R){5.S[a].R[H]=a.R[H]}}}}}q{5.20()}};5.20=l(){6 c=5.k(\'[\\\\33\\\\.]+\');5.k(\'{\');o(c.31(\'.\')>-1){6 a=c.1y(\'.\');6 b=5.B;y(6 i=0;i<a.G;i++){5.B=5.B[a[i]]}F(!5.C(\'}\')){5.1o()}5.k(\'}\');5.B=b}q o((1X.1l(5.B.P))&&(5.B[c])){6 b=5.B;5.B=b[c];F(!5.C(\'}\')){5.1o()}5.k(\'}\');5.B=b}q{5.B.R[c]=5.1x();5.k(\'}\')}};5.1x=l(){6 a={};F(!5.C(\'}\')){o(1Q.1l(5.C(\'\\\\w+\').T())){5.1J(a)}q{6 b=5.k(\'\\\\w+\');5.k(\'{\');a[b]=5.1x();5.k(\'}\')}}p a};5.1J=l(e){6 c=5.k(\'\\\\w+\');6 f=5.k(\'\\\\w+\');6 g=[];F(!5.C(\';\')){6 b=5.k(\'".*?[^\\\\\\\\]"|[^;,]+\');o((c.T()==\'1m\')||(c.T()==\'12\')){b=1G(b)}q o(c.T()==\'1Z\'){6 a,17;o(b.1k(/^\\\\./)){17=b.2X(1).1y(\'.\');a=5.S}q{17=b.1y(\'.\');a=5.B}y(6 i=0;i<17.G;i++){6 d=17[i];o(a[d]){a=a[d]}q o(a.19.H==d){a=a.19}q o(a.Q[d]){a=a.Q[d]}q{a=a.R[d]}b=a}}q{o(b.T()==\'2W\'){b=1W}q{b=1G(b)}}g.I(b);o(5.C(\',\')){5.k(\',\')}}5.k(\';\');o(g.G==1){g=g[0]}e[f]=g}}1R.13=A 1A;6 2V=\'\\2U\\W\\W\\W\';6 1V=\'\\2T\\W\\W\\W\';6 1T=(/3J/i.1C(2P.2O)&&!/3E/i.1C(2P.2O));l 2M(f,e){5.N=f;5.D=e;5.v=0;5.V=l(){6 i=5.v;6 c=5.D.P.T();o(c==\'1E\'||c==\'S\'){6 d=[],E;e=5.D;y(J Y e){o(e[J].P){5.D=e[J];E=5.V();d.I(E)}}5.D=e;p d}q o(c==\'1F\'){6 d=[],E;e=5.D;5.D=e.19;E=5.V();d.I(E);y(2K Y e.Q){5.D=e.Q[2K];E=5.V();d.I(E)}5.D=e;p d}q o(c==\'1z\'){6 a=5.M();6 d=[],1v,E;e=5.D;F(a!=2J){1v=[];y(J Y e){o(e[J].P){5.D=e[J];E=5.V();1v.I(E)}}d.I(1v);a=5.M()}5.D=e;p d}q o(5.N.K(i,i+4)==1V){6 a=5.M();6 d=[],E;F(a!=2J){E=5.V();d.I(E);a=5.M()}p d}6 n=1;o(5.D.18.G){n=5.M();o(c!=\'12\'&&c!=\'1m\'){5.M()}}6 d;o(c==\'2c\'){d=5.2H(n)}q o(c==\'12\'||c==\'1m\'){d=5.2F(n)}q{d=[];6 b;2p(c){L\'2u\':b=\'2E\';U;L\'2o\':b=\'2C\';U;L\'2N\':b=\'1N\';U;L\'2v\':b=\'M\';U;L\'2b\':b=\'2B\';U;L\'21\':b=\'2z\';U;L\'2R\':b=\'1N\';U;L\'2A\':b=\'M\';U}y(6 i=0;i<n;i++){d.I(5[b]())}}o(5.D.18){d=1M(d,5.D.18)}q{d=d[0]}p d};5.2y=l(){6 a=1;6 b=1d;6 i=5.v;5.v=i+a;z=5.N.K(i,i+a);p Z(z,a,b)};5.2z=l(){6 a=4;6 b=1d;6 i=5.v;5.v=i+a;z=5.N.K(i,i+a);p Z(z,a,b)};5.M=l(){6 a=4;6 b=1d;6 i=5.v;5.v=i+a;z=5.N.K(i,i+a);p Z(z,a,b)};5.2B=l(){6 a=4;6 b=16;6 i=5.v;5.v=i+a;z=5.N.K(i,i+a);p Z(z,a,b)};5.1N=l(){6 a=4;6 b=16;6 i=5.v;5.v=i+a;z=5.N.K(i,i+a);p Z(z,a,b)};5.2E=l(){6 b=23;6 a=8;6 c=4;6 i=5.v;5.v=i+c;z=5.N.K(i,i+c);p 1L(z,b,a)};5.2C=l(){6 b=3A;6 a=11;6 c=8;6 i=5.v;5.v=i+c;z=5.N.K(i,i+c);p 1L(z,b,a)};5.2H=l(b){6 i=5.v;6 d=[];y(6 c=0;c<b;c++){d.I(5.2y())}6 a=(4-(b%4))%4;5.v=i+b+a;p d};5.2F=l(a){6 b=[];6 n,i,j;y(6 c=0;c<a;c++){n=5.M();i=5.v;z=5.N.K(i,i+n);2t=(4-(n%4))%4;5.v=i+n+2t;b.I(z)}p b}}l 1M(a,d){o(!d.G)p a[0];6 c=[];6 b,1t,1P;y(6 i=0;i<d[0];i++){b=a.G/d[0];1t=i*b;1P=1t+b;c.I(1M(a.K(1t,1P),d.K(1)))}p c}l 2r(a,b){y(++b;--b;a=((a%=2q+1)&1U)==1U?a*2:(a-1U)*2+2q+1);p a}l 1q(d,a,c){o(a<0||c<=0)p 0;y(6 b,1c=a%8,1I=d.G-(a>>3)-1,1p=d.G+(-(a+c)>>3),15=1I-1p,1H=((d[1I]>>1c)&((1<<(15?8-1c:c))-1))+(15&&(b=(a+c)%8)?(d[1p++]&((1<<b)-1))<<(15--<<3)-1c:0);15;1H+=2r(d[1p++],(15--<<3)-1c));p 1H}l 2n(a){6 b=A 2x(a.G);y(6 i=0;i<a.G;i++){b[i]=a.3y(i)&3x}p b}l Z(a,c,d){6 x=1q(a,0,c*8);6 e=1n.1e(2,c*8);6 b;o(d&&x>=(e/2)){b=x-e}q{b=x}p b}l 1L(f,i,a){6 f=z;6 e=1n.1e(2,a-1)-1;6 b=1q(f,i+a,1);6 c=1q(f,i,a);6 d=0;6 h=2;6 j=f.G+(-i>>3)-1;6 g,1h,1f;3u y(g=f[++j],1h=i%8||8,1f=1<<1h;1f>>=1;(g&1f)&&(d+=1/h),h*=2);F(i-=1h);p c==(e<<1)+1?d?1W:b?-2j:+2j:(1+b*-2)*(c||d?!c?1n.1e(2,-e+1)*d:1n.1e(2,c-e)*(1+d):0)}l 1g(c,b,a){o(2i.2g){6 d=A 2g()}q o(2i.27){6 d=A 27("3s.3r")}d.3q("3p",c,16);o(d.2e){d.2e(\'2d/3n; 3m=x-2a-26\')}q{d.3l(\'3k-3i\',\'x-2a-26\')}d.3h=l(){o(d.3g==4){o(!a){b(d.29)}q o(1T){b(1B(d.3f).3e())}q{b(2n(d.29))}}};d.3d(\'\')}l 3c(f,d,e){o(e)f=e+\'?12=\'+25(f);1g(f+\'.2G\',l(b){6 c=A 1u(b).14();1g(f+\'.24\',l(a){c=A 1R(a,c).14();d(c)})})}l 3b(g,e,f){o(f)g=f+\'?12=\'+25(g);1g(g,l(d){6 c=\'\';F(!c.1k(/\\3a:\\n$/)){c+=1w.39(d.3v(0,1))}c=c.1S(0,c.G-7);6 a=A 1u(c).14();6 b=A 2M(d,a).V();e(b)},16)}o(1T)38.37(\'<2l P="2d/36">\\n    22 1B(1r)\\n        35 i\\n        34 1O(2S(1r))\\n        32 i = 1 30 2S(1r)\\n            1O(i-1) = 3F(2Z(1r, i, 1))\\n        3H\\n        1B = 1O\\n    2Y 22\\n</2l>\');',62,232,'|||||this|var||||||||||||||consume|function|||if|return|else|||||_pos|||for|data|new|_target|peek|dapvar|tmp|while|length|name|push|child|slice|case|_unpack_uint32|_buf|stream|type|maps|attributes|dataset|toLowerCase|break|getValue|x00|dapType|in|decodeInt|||url|prototype|parse|diff|true|tokens|shape|array|id|replace|offsetRight|false|pow|mask|proxyUrl|startBit|_base_declaration|token|match|contains|string|Math|_attr_container|lastByte|readBits|Binary|_declaration|start|ddsParser|struct|String|_metadata|split|sequence|simpleParser|BinaryToArray|test|el|structure|grid|pseudoSafeEval|sum|curByte|_attribute|walk|decodeFloat|reshape|_unpack_int32|byteArray|stop|atomicTypes|dasParser|substr|IE_HACK|0x40000000|START_OF_SEQUENCE|NaN|structures|RegExp|alias|_container|uint16|Function||das|encodeURIComponent|defined|ActiveXObject|Grid|responseText|user|int16|byte|text|overrideMimeType|dimensions|XMLHttpRequest|_sequence|window|Infinity|_structure|script|_grid|getBuffer|float64|switch|0x7fffffff|shl|attr|padding|float32|uint|ltrim|Array|_unpack_byte|_unpack_uint16|uint32|_unpack_int16|_unpack_float64|_dataset|_unpack_float32|_unpack_string|dds|_unpack_bytes|Dataset|2768240640|map|Structure|dapUnpacker|int|userAgent|navigator|Sequence|int32|LenB|x5a|xa5|END_OF_SEQUENCE|nan|substring|End|MidB|To|indexOf|For|w_|ReDim|Dim|vbscript|write|document|fromCharCode|nData|loadData|loadDataset|send|toArray|responseBody|readyState|onreadystatechange|Charset|parseInt|Accept|setRequestHeader|charset|plain|eval|GET|open|XMLHTTP|Microsoft|default|do|splice|Eaeflnr|0xff|charCodeAt|rtrim|52|trim|to|Unable|opera|AscB|Error|Next|throw|msie'.split('|'),0,{}))