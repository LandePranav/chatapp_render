/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme') ;

export default {
  content: [
    "./src/*.jsx",
    "./src/components/*.jsx",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'purpleImg': "url('/purpleback.jpeg')",
        'dreamy': "url('/dreamy.jpg')",
        'greyBonsai': "url('/greybonsai.jpg')",
        'rainShed': "url('/rainShed.jpg')",
        'crimsonSky': "url('/crimsonSky.jpeg')",
        'moon': "url('/moon.jpg')",
        'shootingStar': "url('/shootingStar.jpg')",
        'mount': "url('/mount.jpg')",
        'blackShade': "url('/blackShade.jpg')",
        'darkTrees': "url('/darkTrees.jpg')",
        'darkMount': "url('/darkMount.png')",
      },
      fontFamily: {
        satisfy : ['"Satisfy"', ...defaultTheme.fontFamily.sans]
      },
      colors: {
        'pal1': '#5b5f97',
        'pal2': '#b8b8d1',
        'pal3': '#801336',
        'pal4': '#510A32',
        'pal5': '#2D142C',
        'login': '#5b5f97',
  
      },
    },
  },
  plugins: [
    function ({addUtilities}){
      const newUtilities = {
        ".scrollbar-thin": {
          scrollbarWidth: "thin",
          scrollbarColor: "#36454f transparent",
          borderRadius: "10px"
        },
        ".scrollbar-webkit": {
          "&::-webkit-scrollbar": {
            width: "8px"
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent"
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(50 ,50, 50, 0.3)",
            borderRadius: '20px',
            border: '1px solid transparent'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker color on hover
          },

        }
      }
      addUtilities(newUtilities, ["responsive", "hover"])
    }
  ],
}

