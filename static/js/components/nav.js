document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("nav-logout")) {
        document.getElementById("nav-logout").addEventListener("click", async () => {
            const res = await fetch("/shersocial/api/logout", {
                method: "POST"
            });
            if (res.ok) {
                window.location.reload();
            }
        });
    }
})