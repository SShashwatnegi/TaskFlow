import React, { useState } from 'react';
import axios from 'axios';

export default function AuthPage({onLogin}){
  const [email,setEmail]=useState(""); 
  const [otp,setOtp]=useState("");
  const [otpSent,setOtpSent]=useState(false);
  const [error,setError]=useState(""); const [loading,setLoading]=useState(false);

  function issueToken(data){ 
      localStorage.setItem("ss_token", data.token); 
      localStorage.setItem("ss_user", JSON.stringify(data.user)); 
      onLogin(data.user); 
  }

  async function sendOtp(){ 
      if(!email.includes("@")){setError("Enter a valid email");return;} 
      setLoading(true); setError("");
      try {
          await axios.post('http://localhost:5000/api/auth/login', { email });
          setOtpSent(true);
      } catch (err) {
          setError(err.response?.data?.error || "Failed to send OTP");
      }
      setLoading(false);
  }

  async function handleVerify(){ 
      if(!otp){setError("Enter OTP");return;}
      setLoading(true); setError("");
      try {
          const { data } = await axios.post('http://localhost:5000/api/auth/verify', { email, otp });
          issueToken(data);
      } catch (err) {
          setError(err.response?.data?.error || "Invalid OTP");
      }
      setLoading(false);
  }

  const inp={width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid #dadce0",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:12,color:"#202124"};
  const btn=(primary)=>({width:"100%",padding:"11px 0",borderRadius:20,border:primary?"none":"1px solid #dadce0",background:primary?"#1a73e8":"white",color:primary?"white":"#1a73e8",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:"inherit"});

  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8f9fa",fontFamily:"'Google Sans',Arial,sans-serif"}}>
      <div style={{background:"white",borderRadius:8,border:"1px solid #dadce0",padding:"48px 40px",width:360,boxSizing:"border-box"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:"#1a73e8",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",color:"white",fontSize:20,fontWeight:700}}>S</div>
          <h2 style={{margin:0,fontSize:24,fontWeight:400,color:"#202124"}}>TaskFlow</h2>
          <p style={{margin:"8px 0 0",color:"#5f6368",fontSize:14}}>Sign in to your account</p>
        </div>
        {error&&<div style={{background:error.startsWith("OTP")?"#e6f4ea":"#fce8e6",color:error.startsWith("OTP")?"#137333":"#c5221f",padding:"9px 13px",borderRadius:6,fontSize:13,marginBottom:14}}>{error}</div>}
        
        <input style={inp} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} type="email"/>
        
        {!otpSent
          ?<button style={btn(false)} onClick={sendOtp} disabled={loading}>{loading?"Sending OTP...":"Send verification OTP"}</button>
          :<><input style={inp} placeholder="Enter 6-digit OTP" value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6}/>
            <button style={btn(true)} onClick={handleVerify} disabled={loading}>{loading?"Verifying...":"Sign in"}</button></>
        }
      </div>
    </div>
  );
}
