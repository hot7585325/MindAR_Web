const Model = document.querySelector("#Model")
const btn_Scale_Up = document.querySelector("#Scale_Up")
const btn_Scale_Down = document.querySelector("#Scale_Down")

btn_Scale_Up.addEventListener("click", () => {
    const orgsclae = Model.getAttribute("scale");
    const NewScale = {
        x: orgsclae.x * 1.2,
        y: orgsclae.y * 1.2,
        z: orgsclae.z * 1.2
    }
    Model.setAttribute("scale", NewScale);
})