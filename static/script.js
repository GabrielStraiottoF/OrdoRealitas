const classeSelect = document.getElementById("classe")

classeSelect.addEventListener("change", function(){

    const classe = classeSelect.value
    const body = document.body

    body.classList.remove("combatente")
    body.classList.remove("especialista")
    body.classList.remove("ocultista")

    if(classe === "combatente"){
        body.classList.add("combatente")
    }

    if(classe === "especialista"){
        body.classList.add("especialista")
    }

    if(classe === "ocultista"){
        body.classList.add("ocultista")
    }

})