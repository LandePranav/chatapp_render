export default function Avatar({username,userId,online}) {
    const colors = [
        'bg-red-200','bg-pink-200','bg-purple-200',
        'bg-yellow-200', 'bg-teal-300', 'bg-blue-200',
        'bg-green-200', 'bg-gray-500', 'bg-white','bg-black'
    ] ;

    const userIdBase10 = parseInt(userId.substring(10), 16) ;
    const colorIndex = userIdBase10 % colors.length ;
    const color = colors[colorIndex] ;

    return (
        <div className={"flex w-7 h-7 border-2 border-black rounded-full items-center relative text-black "+color}>
            <div className=" text-center w-full opacity-80">
                {username[0]}
            </div>
            {online && (
                <div className="absolute w-3 h-3 rounded-full bg-green-700 bottom-0 -right-1 border border-white shadow-lg"></div>
            )}
            {!online && (
                <div className="absolute w-3 h-3 rounded-full bg-gray-300 bottom-0 -right-1 border border-white shadow-lg"></div>
            )}
            
        </div>
    ) ;
}