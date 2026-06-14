// engine.mjs -- rare-event pooling core EXTRACTED VERBATIM from index.html
// (normalCDF/Quantile, chiSqP, petoOR, mhOR, dlRE). The DOM alpha lookup is
// stubbed to 0.05 so the SAME math runs headless.
const document = { getElementById: () => ({ value: '0.05' }) };

function normalCDF(z){const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;const s=z<0?-1:1;const x=Math.abs(z)/Math.sqrt(2);const t=1/(1+p*x);const y=1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);return 0.5*(1+s*y)}
function normalQuantile(p){if(p<=0)return-Infinity;if(p>=1)return Infinity;if(p===0.5)return 0;const a=p<0.5?p:1-p;const t=Math.sqrt(-2*Math.log(a));const c0=2.515517,c1=0.802853,c2=0.010328,d1=1.432788,d2=0.189269,d3=0.001308;let z=t-(c0+c1*t+c2*t*t)/(1+d1*t+d2*t*t+d3*t*t*t);if(p<0.5)z=-z;return z}
function chiSqP(x,df){if(x<=0)return 1;return 1-regGammaP(df/2,x/2)}
function regGammaP(a,x){if(x<=0)return 0;const lga=lgamma(a);if(x<a+1){let s=1/a,t=1/a;for(let n=1;n<200;n++){t*=x/(a+n);s+=t;if(Math.abs(t)<1e-12*Math.abs(s))break}return s*Math.exp(-x+a*Math.log(x)-lga)}else{let f=1,b2=x+1-a,c2=1/1e-30,d2=1/b2;f=d2;for(let i=1;i<=200;i++){const an=-i*(i-a),bn=x+2*i+1-a;d2=bn+an*d2;if(Math.abs(d2)<1e-30)d2=1e-30;d2=1/d2;c2=bn+an/c2;if(Math.abs(c2)<1e-30)c2=1e-30;f*=d2*c2;if(Math.abs(d2*c2-1)<1e-10)break}return 1-f*Math.exp(-x+a*Math.log(x)-lga)}}
function lgamma(x){const g=7,c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];if(x<0.5)return Math.log(Math.PI/Math.sin(Math.PI*x))-lgamma(1-x);x-=1;let a=c[0];const t=x+g+0.5;for(let i=1;i<g+2;i++)a+=c[i]/(x+i);return 0.5*Math.log(2*Math.PI)+(x+0.5)*Math.log(t)-t+Math.log(a)}

function petoOR(data){
  const studies=data.filter(d=>!d.excluded&&(d.et+d.ec)>0);
  if(studies.length===0)return null;
  let sumOE=0,sumV=0;
  for(const d of studies){
    const n=d.nt+d.nc;
    const E=d.et+d.ec;
    const expected=E*d.nt/n;
    const O_E=d.et-expected;
    const V=E*(n-E)*d.nt*d.nc/(n*n*(n-1));
    if(V>0){sumOE+=O_E;sumV+=V;}
  }
  if(sumV===0)return null;
  const logOR=sumOE/sumV;
  const se=1/Math.sqrt(sumV);
  const OR=Math.exp(logOR);
  const z=logOR/se;
  const p=2*(1-normalCDF(Math.abs(z)));
  const alpha=parseFloat(document.getElementById('alpha').value)||0.05;
  const zc=normalQuantile(1-alpha/2);
  return{method:'Peto OR',OR,logOR,se,ci:[Math.exp(logOR-zc*se),Math.exp(logOR+zc*se)],p,k:studies.length};
}

// Mantel-Haenszel OR
function mhOR(data){
  const studies=data.filter(d=>!d.excluded);
  if(studies.length===0)return null;
  let sumR=0,sumS=0,sumPR=0,sumQS=0,sumPSQR=0;
  for(const d of studies){
    const a=d.et2||d.et,b=(d.nt2||d.nt)-a,c=d.ec2||d.ec,dd=(d.nc2||d.nc)-c;
    const n=a+b+c+dd;
    if(n===0)continue;
    const R=a*dd/n;
    const S=b*c/n;
    sumR+=R;sumS+=S;
    // Robins-Breslow-Greenland variance accumulators
    const P=(a+dd)/n,Q=(b+c)/n;
    sumPR+=(P*R);
    sumQS+=(Q*S);
    sumPSQR+=(P*S+Q*R);
  }
  if(sumS===0||sumR===0)return null;
  const OR=sumR/sumS;
  const logOR=Math.log(OR);
  // Robins-Breslow-Greenland variance of ln(OR_MH) (Greenland & Robins 1985)
  const V=sumPR/(2*sumR*sumR)+sumPSQR/(2*sumR*sumS)+sumQS/(2*sumS*sumS);
  const se=Math.sqrt(V);
  const z=logOR/se;
  const p=2*(1-normalCDF(Math.abs(z)));
  const alpha=parseFloat(document.getElementById('alpha').value)||0.05;
  const zc=normalQuantile(1-alpha/2);

  // Cochran Q for heterogeneity
  let Q=0;
  for(const d of studies){
    const a=d.et2||d.et,b=(d.nt2||d.nt)-a,c=d.ec2||d.ec,dd2=(d.nc2||d.nc)-c;
    if(a*dd2===0&&b*c===0)continue;
    const or_i=(a*dd2)/(b*c||1e-10);
    const logOR_i=Math.log(or_i||1e-10);
    const v_i=1/a+1/Math.max(b,0.01)+1/Math.max(c,0.01)+1/Math.max(dd2,0.01);
    Q+=(logOR_i-logOR)*(logOR_i-logOR)/v_i;
  }
  const df=studies.length-1;
  const Qp=chiSqP(Q,df);
  const I2=Math.max(0,(Q-df)/Q)*100;

  return{method:'Mantel-Haenszel OR',OR,logOR,se,ci:[Math.exp(logOR-zc*se),Math.exp(logOR+zc*se)],p,k:studies.length,Q,Qp,I2};
}

// DerSimonian-Laird random effects (log OR scale)
function dlRE(data){
  const studies=data.filter(d=>!d.excluded);
  const ors=[];
  for(const d of studies){
    const a=d.et2||d.et,b=(d.nt2||d.nt)-a,c=d.ec2||d.ec,dd=(d.nc2||d.nc)-c;
    if(a<=0||b<=0||c<=0||dd<=0)continue;
    const logOR=Math.log((a*dd)/(b*c));
    const v=1/a+1/b+1/c+1/dd;
    ors.push({logOR,v,name:d.name});
  }
  if(ors.length<2)return null;

  // Fixed-effect first
  let sumW=0,sumWY=0;
  for(const o of ors){const w=1/o.v;sumW+=w;sumWY+=w*o.logOR}
  const fe=sumWY/sumW;

  let Q=0;
  for(const o of ors){const w=1/o.v;Q+=w*(o.logOR-fe)*(o.logOR-fe)}
  const df=ors.length-1;
  const Qp=chiSqP(Q,df);

  let sumW2=0;
  for(const o of ors)sumW2+=(1/o.v)*(1/o.v);
  const C=sumW-sumW2/sumW;
  const tau2=Math.max(0,(Q-df)/C);

  let sumWre=0,sumWreY=0;
  for(const o of ors){const w=1/(o.v+tau2);sumWre+=w;sumWreY+=w*o.logOR}
  const beta=sumWreY/sumWre;
  const se=1/Math.sqrt(sumWre);
  const OR=Math.exp(beta);
  const z=beta/se;
  const p=2*(1-normalCDF(Math.abs(z)));
  const alpha=parseFloat(document.getElementById('alpha').value)||0.05;
  const zc=normalQuantile(1-alpha/2);
  const I2=Math.max(0,(Q-df)/Q)*100;

  return{method:'DL Random Effects',OR,logOR:beta,se,ci:[Math.exp(beta-zc*se),Math.exp(beta+zc*se)],p,k:ors.length,Q,Qp,I2,tau2};
}

export { petoOR, mhOR, dlRE };
