import axios from "axios";
import { useContext, useState } from "react";
import { userContext } from "./userContext";

export default function Registerlogin () {
    const [username, setUsername] = useState('') ;
    const [password, setPassword] = useState('') ;
    const [isLoginorRegister, setIsLoginorRegister] = useState('login') ;
    const {setUsername : setLoggedInUsername,setUserId} = useContext(userContext) ;
    const [isInvalid, setIsInvalid] = useState(false) ;
    const [invalidRes, setInvalidRes] = useState('') ;

    async function handleSubmit(e){
        e.preventDefault() ;
        const url = isLoginorRegister ;
        try {
            const {data} = await axios.post(url, {username,password}).then(console.log("req sent"));
            console.log(data) ;
            if(url === 'register'){
                if(data !== 'exists'){
                    setLoggedInUsername(username) ;
                    setUserId(data.id) ;
                }else{
                    setIsInvalid(true) ;
                    setInvalidRes(data) ;
                    setTimeout(()=>{
                        setIsInvalid(false) ;
                        setInvalidRes('') ;
                    }, 2500) ;
                }
            }else if (url === "login"){
                if(data === "Invalid-Cred"){
                    console.log("wrong id or pass") ;
                    setIsInvalid(true) ;
                    setInvalidRes(data) ;
                    setTimeout(()=>{
                        setIsInvalid(false) ;
                        setInvalidRes('') ;
                    }, 2500) ;
                } else {
                    setLoggedInUsername(username) ;
                    setUserId(data.id) ;
                }
            }
        } catch (error) {
            if(error) console.log(error) ;
        }
    }

    return(
            <div className="h-dvh md:h-screen flex items-center bg-greyBonsai bg-center bg-no-repeat bg-cover">
                <div className="w-full h-full my-auto flex items-center">
                    <form onSubmit={handleSubmit} className="mx-auto flex flex-col w-64 p-4 my-4 text-center pb-28 md:pb-0 " >
                        <div className="font-bold font-mono text-lg border-b flex gap-2 items-center pb-1.5 text-white ">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                                    <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z" />
                                    <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
                                    </svg>
                                    <span>
                                        Chat Application
                                    </span>
                        </div>
                        <div className="flex justify-around gap-1 my-3 items-center w-full">
                            <button type="button" onClick={e => setIsLoginorRegister('login')} className={"rounded-md py-1.5 px-2 w-80 "+(isLoginorRegister === 'login' ? "bg-blue-300 block" : "bg-gray-200")} >Login</button>
                            <button type="button" onClick={e => setIsLoginorRegister('register')} className={"rounded-md px-2 w-80 py-1.5 "+(isLoginorRegister === 'register' ? "bg-blue-300 " : "bg-gray-200")}>Register</button>
                        </div>
                        <input 
                            type = "text"
                            className="p-1 px-3 mb-2 border rounded-md "
                            value = {username}
                            placeholder="username"
                            onChange = {e => setUsername(e.target.value)}
                        />

                        <input 
                            type = "password"
                            value = {password}
                            className="p-1 mb-2 border rounded-md px-3"
                            autoComplete="false"
                            placeholder="password"
                            onChange = {e => setPassword(e.target.value)}
                        />
                        
                        <button 
                            type="submit"
                            className="bg-blue-500 p-1 mb-2 border rounded-md" 
                        >
                            { isLoginorRegister === 'login' ? 'Login' : 'Register' }
                        </button>

                        {isInvalid && (
                <div className={"text-red-400 "}>
                    {invalidRes === 'exists' ? 'Username Already Registered' : 'Username or Password Invalid !'}
                </div>
            ) }

                    </form>
                </div>
                
            </div>
    ) ;
}