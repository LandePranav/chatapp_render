import Avatar from "./avatar";
export default function Contact({userId, onClick, selected, username, online }) {
    return(
        <div 
            onClick={()=> onClick(userId)} 
            key={userId} 
            className={
                "flex gap-3 mb-2 rounded-md text-lg cursor-pointer items-center padding transition-all ease-in-out hover:bg-slate-200 hover:text-black duration-800 font-mono "+ (selected ? "bg-white bg-opacity-50 text-black font-normal":  " text-white hover:bg-opacity-20")}
        >
            <div className=" flex w-full items-center" >
                {selected && (
                                <div className="w-2 h-10 bg-red-300 rounded-r-md mr-2 "> 
                                </div>
                            )}

                            <div className="pl-2 mr-2 my-2.5 flex gap-4 items-center ">
                                <Avatar 
                                    online={online} 
                                    //username={onlinePeopleExclOurUser[userId]} 
                                    username={username}
                                    userId={userId} />
                                {username}
                            </div>
            </div>
                            
        </div>
    ) ;
}