import { useContext, useEffect, useRef, useState } from "react";
import Logo from "./logo";
import { userContext } from "./userContext";
import { uniqBy } from "lodash";
import axios from "axios";
import Contact from "./contact";
import AudioRecorder from "./recorder";

export default function Chat() {
    const [ws,setws] = useState(null) ;
    const [newMessage, setNewMessage] = useState('') ;
    const [messages, setMessages] = useState([]) ;
    const [onlinePeople, setOnlinePeople] = useState({}) ;
    const [offlinePeople, setOfflinePeople] = useState({}) ;
    const [selectedUser, setSelectedUser] = useState(null) ;
    const {username, userId,setUserId, setUsername} = useContext(userContext) ;
    const divUnderMsg = useRef();
    const [navVisible, setNavVisible] = useState(true);
    
    useEffect(() => {
        connectTows() ;
        //cleanup func
        return () => {
            if(ws) {
                ws.removeEventListener('message', handleMessage) ;
                //ws.removeEventListener('close') ;
                ws.close() ;
                ws.removeEventListener('close', () => {})
            }
        }
    }, []) ; //selectedUser

    function connectTows(){
        const ws = new WebSocket('wss://chatapp-aws-render-final.onrender.com/api') ;
        //const ws = new WebSocket('wss://zenith-chatapp.vercel.app') ;
        setws(ws) ;
        ws.addEventListener('message', handleMessage) ;
        ws.addEventListener('close', () => {
                setTimeout(()=> {
                    console.log("Disconnected . Trying to reconnect .") ;
                    connectTows() ;
                }, 5000) ;
        }) ;
    }

    useEffect(()=> {
        const div = divUnderMsg.current ;
        if(div){
            div.scrollIntoView({behavior:'smooth', block:'end'})
        }
    }, [messages]) ;

    useEffect(() => {
        axios.get('/people').then(res => {
            const offlinePeopleArr = res.data
                                    .filter(p => p._id !== userId)
                                    .filter(p => !Object.keys(onlinePeople).includes(p._id));
            // console.log(offlinePeople) ;
            const offlinePeople = {} ;
            offlinePeopleArr.forEach(p => {
                offlinePeople[p._id] = p ;
            }) ;
            setOfflinePeople(offlinePeople) ;
        } ) ;
        
    }, [onlinePeople])

    useEffect(() => {
      if(selectedUser){
        axios.get('/messages/'+selectedUser).then(res => {
            setMessages(res.data) ;
        }
        ) ;
      }
    }, [selectedUser])

    function showOnlinePeople(peopleArray){
        const people = {} ;
        peopleArray.forEach(({userId,username}) => {
            if(userId && username){people[userId] = username ;}
        });
        setOnlinePeople(people) ;
    }

    function handleMessage(e){
        const messageData = JSON.parse(e.data) ;
        console.log(messageData) ;
        if('online' in messageData){
            showOnlinePeople(messageData.online) ;
        } else if ('text' in messageData) {
            if(messageData.sender === selectedUser  ) { {/* || messageData.sender === userId */}
                setMessages(prev => ([...prev,{...messageData,isOur:false}])) ;
            }
        }
    }

    async function sendMessage(e,file=null){
        if(e) e.preventDefault() ;
        
        await ws.send(JSON.stringify({
            recipient:selectedUser,
            text:newMessage,
            file
        })) ;

        if(file) {
            setTimeout(() => {
                axios.get('/messages/'+ selectedUser ).then( res => {
                    setMessages(res.data) ;
                }) ;
            }, 2000)
        }else {
            setNewMessage('') ;
            setMessages(prev => ([...prev,{
                text:newMessage, 
                isOur:true, 
                sender: userId, 
                recipient: selectedUser, 
                _id:Date.now()
            }])) ;
        }

        //console.log({messages}) ;
    } 

    async function sendFile(e,recordedBlob=null){

        const reader = new FileReader() ;
        console.log(e) ;
        if(recordedBlob){
            //console.log(recordedBlob);
            reader.readAsDataURL(recordedBlob) ;
        
            reader.onload = () => {
                sendMessage(null, {
                    name: Date.now() + ".webm",
                    data : reader.result,
                }) ;
            }
            
        }else{
            reader.readAsDataURL(e.target.files[0]) ;
        
            reader.onload = () => {
                sendMessage(null, {
                    name: e.target.files[0].name,
                    data : reader.result,
                }) ;
            }
        }
        
    }

    function logout() {
        axios.post('/logout').then(() => {
            setws(null) ;
            setUserId(null) ;
            setUsername(null) ;
            window.location.reload() ;
        }) ;
    }

    const onlinePeopleExclOurUser = {...onlinePeople} ;
    delete onlinePeopleExclOurUser[userId] ;

    const messagesWithoutDupes = uniqBy(messages, '_id') ;

    return(
        <div className={"relative top-0 bottom-0 right-0  md:static flex h-dvh w-screen overflow-hidden"}>
            <div className={"w-screen absolute top-0 bottom-0 md:static md:w-1/3 bg-blackShade bg-center bg-no-repeat bg-cover flex flex-col border-r-4 transition-all duration-300  ease-in-out "+ (navVisible ? "left-0" : "-left-full" )}>
                <Logo />
                <div className="flex-grow overflow-y-scroll scrollbar-webkit scrollbar-thin px-2">
                    <div className="pl-4 uppercase">
                    {Object.keys(onlinePeopleExclOurUser).map(userId => (
                        <Contact 
                            key={userId}
                            userId={userId}
                            username={onlinePeopleExclOurUser[userId]}
                            onClick={()=> {
                                setSelectedUser(userId);
                                setNavVisible(false);
                            }}
                            selected={userId === selectedUser} 
                            online={true} 
                            />
                        ))}

                        {Object.keys(offlinePeople).map(userId => (
                        <Contact 
                            key={userId}
                            userId={userId}
                            username={offlinePeople[userId].username}
                            onClick={()=> {
                                setSelectedUser(userId);
                                setNavVisible(false);
                            }}
                            selected={userId === selectedUser} 
                            online={false} 
                            />
                        ))}
                    </div>
                </div>

                    <div className="w-4/5 mx-auto text-center justify-between flex items-center px-4 py-3 mb-3 rounded-2xl border-t-slate-500 bg-slate-100 overflow-hidden mt-3 "> 
                        <div className="flex gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                            <span className=" border-b-2 border-slate-400" >
                                {username}
                            </span>
                        </div>
                        <span className="bg-red-400 flex rounded-xl px-3 py-1 ml-3">
                            <button type="button" onClick={logout} >
                                Logout
                            </button>
                        </span>
                    </div>
            </div> 

            <div className={"h-dvh w-screen absolute top-0 bottom-0 md:static md:w-2/3 flex flex-col bg-darkMount bg-no-repeat bg-cover pb-2.5 transition-all duration-300 ease-in-out "+ (!navVisible ? "left-0" : "left-full" ) } >

                {!selectedUser && (
                    <div className="flex flex-grow items-center justify-center pl-2 font-mono text-white">
                        &larr; Select a user to open chat
                    </div>
                )} 

                {!!selectedUser && (
                        <div className="relative h-full mx-2">
                        <div className="w-full relative bg-slate-300 font-mono font-extrabold pl-4 z-50 -ml-0 flex gap-6 py-2 items-center rounded-lg uppercase mx-0 md:pl-12 border-2 border-gray-600">
                            <button onClick={()=>setNavVisible(true)} className="md:hidden" >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 9-3 3m0 0 3 3m-3-3h7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </button>
                            {onlinePeople[selectedUser] || offlinePeople[selectedUser]?.username || 'Unknown'}
                        </div>
                            <div className="absolute pt-12 pl-2 font-mono w-full overflow-y-scroll scrollbar-webkit scrollbar-thin  my-2 top-0 left-0 right-0 bottom-2">
                                {messagesWithoutDupes.map(m => (
                                    <div key={m._id} className={" " +(m.sender === userId ? "text-right mr-2" : "text-left")}>
                                        <div className={"text-left inline-block rounded-md  px-3 py-1.5 m-2 -mb-0.5 p "+(m.sender === userId ? " bg-blue-300" : " bg-white")}>
                                                {m.text}
                                                {m.file && (
                                                    <div> 
                                                        <a target="_blank" className="border-b flex items-center gap-1" href={m.file} > 
                                                        {/*in href u can have axios.defaults.baseURL + 'uploads/' + m.file.split('/')[m.file.split('/').length - 1]... for local image if saving in uplods in localhost  */}
                                                            {m.file.split('.')[m.file.split('.').length -1] !== 'webm' ? (
                                                                <> 
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 p-0.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                                                </svg>
                                                                {/*img-filename ....{m.file.split('/')[m.file.split('/').length - 1]}*/}
                                                                <img src={m.file} className="w-30 h-7 rounded-md border-white" ></img> </>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="purple" className="w-5 h-5">
                                                                    <path d="M7 4a3 3 0 0 1 6 0v6a3 3 0 1 1-6 0V4Z" />
                                                                    <path d="M5.5 9.643a.75.75 0 0 0-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-1.5v-1.546A6.001 6.001 0 0 0 16 10v-.357a.75.75 0 0 0-1.5 0V10a4.5 4.5 0 0 1-9 0v-.357Z" />
                                                                    </svg>

                                                                    <audio className="h-8 rounded-none" controls src={m.file} ></audio>
                                                                </div>
                                                                
                                                            )}
                                                            
                                                        </a>
                                                    </div>
                                                )}
                                        </div>

                                    </div>
                                ))}
                                <div ref={divUnderMsg} > </div>
                            </div>
                        </div>
                    
                )}

                {!!selectedUser && (
                    <div>
                        <form className="flex gap-3 w-full pr-6 pl-3 mb-2" onSubmit={(e) => {e.preventDefault();sendMessage();}}>
                                <input 
                                    type="text" 
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    className="flex-grow pl-2 ml-3 rounded-md" 
                                    placeholder="type message here ..." 
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter' && !e.shiftKey){
                                            e.preventDefault();
                                            sendMessage() ;
                                        }
                                    }}
                                />  

                                <label >
                                    <AudioRecorder sendFile={sendFile} />
                                </label>

                                <label 
                                    className=" rounded-md cursor-pointer flex items-center "
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-7 h-7 p-0.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                    </svg>

                                    <input
                                        hidden={true}
                                        type="file"
                                        onChange={sendFile}
                                    />
                                </label>



                                <button 
                                    type='submit'
                                    className="rounded-full cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-7 h-7 p-0.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                    </svg>
                                </button>

                        </form>
                    </div>
                )}

            </div>
        </div>
    ) ;
}