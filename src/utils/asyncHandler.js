//First method: More advance
const asyncHandler = (requestHandler) => {
   (req, res, next) =>{
        Promise.resolve(requestHandler(req, res, next)).catch((err)=> next(err))
    }
}


export {asyncHandler}


// const asyncHandler = () => {}
// //Higher order function --> pass function as a parameter
// const asyncHandler = (func) =>  ()=>{}  // or const asyncHandler = (func) => { ()=>{} }
// const asyncHandler = (func) => async ()=>{}
//Second method.
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500 ).json({
//             success : false,
//             message: error.message
//         })
//     }
// }