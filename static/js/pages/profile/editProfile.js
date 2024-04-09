const editProfileForm = document.getElementById("edit-profile-form");
const editProfileBtn = document.getElementById("edit-profile-btn");
const uploadImageForm = document.getElementById("upload-image-form");
const uploadImageBtn = document.getElementById("upload-image-btn");
const removeImageBtn = document.getElementById("remove-image-btn");
const fields = {
    username: document.getElementById("username"),
    firstName: document.getElementById("firstName"),
    lastName: document.getElementById("lastName"),
    image: document.getElementById("image-input"),
    imageLink: document.getElementById("image-link-input"),
};
const editFormError = document.getElementById("edit-form-error");
const uploadImageFormError = document.getElementById("upload-image-form-error");

const setLoading = (loading) => {
    if (loading) {
        // Set disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].setAttribute("disabled", "true");
        });
        editProfileBtn.setAttribute("disabled", "true");
        uploadImageBtn.setAttribute("disabled", "true");
    } else {
        // Remove disabled attribute for all inputs and buttons
        Object.keys(fields).forEach(k => { // Loop keys of fields
            fields[k].removeAttribute("disabled");
        });
        editProfileBtn.removeAttribute("disabled");
        uploadImageBtn.removeAttribute("disabled");
    }
};

const setError = (field, message) => {
    if (fields[field]) {
        fields[field].classList.add("is-invalid");
        fields[field].parentElement.getElementsByClassName("form-text")[0].innerText = message;
    };
    if (field === "image") {
        fields.imageLink.classList.add("is-invalid");
        fields.imageLink.parentElement.getElementsByClassName("form-text")[0].innerText = message;
    }
};

const setEditFormError = (message) => {
    Object.keys(fields).filter(f => !["image", "imageLink"].includes(f)).forEach(k => {
        fields[k].classList.add("is-invalid");
    });
    editFormError.innerText = message;
};

const setImageFormError = (message) => {
    Object.keys(fields).filter(f => ["image", "imageLink"].includes(f)).forEach(k => {
        fields[k].classList.add("is-invalid");
    });
    uploadImageFormError.innerText = message;
};

const resetErrors = () => {
    Object.keys(fields).forEach(k => {
        fields[k].classList.remove("is-invalid");
        fields[k].parentElement.getElementsByClassName("form-text")[0].innerText = "";
    });
    editFormError.innerText = "";
    uploadImageFormError.innerText = "";
};

const handleChange = () => {
    if (Object.keys(fields).filter(k => !["image", "imageLink"].includes(k) && fields[k].value.trim() === "").length > 0) {
        editProfileBtn.setAttribute("disabled", "true");
        console.log("Empty");
    }
    else if (Object.keys(fields).filter(k => !["image", "imageLink"].includes(k) && fields[k].value !== user[k]).length > 0) {
        editProfileBtn.removeAttribute("disabled");
        console.log("Not current");
    }
    else {
        editProfileBtn.setAttribute("disabled", "true");
        console.log("Same as current");
    }
};

const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        fields.imageLink.value = "https://";
    }
    handleAnyImage();
};

const handleImageLinkChange = (e) => {
    fields.image.value = null;
    handleAnyImage();
};

const handleAnyImage = () => {
    if ((fields.image.files && fields.image.files[0]) || /https?:\/\/[^\.]*\..+/.test(fields.imageLink.value)) {
        uploadImageBtn.removeAttribute("disabled");
    } else {
        uploadImageBtn.setAttribute("disabled", true);
    }
};

const convertDataUri = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.onerror = (err) => {
            reject(err);
        }
        reader.readAsDataURL(file);
    });
};

const handleImageUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetErrors();
    const file = fields.image.files[0];
    const body = {
        image: file ? await convertDataUri(file) : fields.imageLink.value,
        fileType: file ? file.name.split(".").slice(-1) : null
    };
    const res = await fetch("/shersocial/api/profile-image", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (res.ok) {
        window.location.reload();
    } else {
        const data = await res.json();
        if (data.errors) {
            if (data.errors.image) {
                setImageFormError(data.errors.image);
            }
        } else if (data.detail) {
            setImageFormError(data.detail);
        } else {
            setImageFormError("Unable to update profile.");
        }
        setLoading(false);
    }
};

const handleDeleteImage = async () => {
    resetErrors();
    setLoading(true);
    const res = await fetch("/shersocial/api/delete-profile-image", {
        method: "DELETE"
    });
    if (res.ok) {
        window.location.reload();
    }
    else {
        setLoading(false);
    }
};

const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetErrors();
    const body = {
        username: fields.username.value.toLowerCase(),
        firstName: fields.firstName.value,
        lastName: fields.lastName.value
    };
    Object.keys(body).forEach(k => {
        if (k === "") delete body[k];
    });
    const res = await fetch("/shersocial/api/edit-profile", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });
    if (res.ok) {
        window.location.reload();
    } else {
        const data = await res.json();
        if (data.errors) {
            Object.keys(data.errors).forEach(k => {
                setError(k, data.errors[k]);
            });
        } else if (data.detail) {
            setEditFormError(data.detail);
        } else {
            setEditFormError("Unable to update profile.");
        }
        setLoading(false);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    editProfileForm.addEventListener("submit", handleEditSubmit);
    editProfileForm.addEventListener("change", handleChange);
    editProfileForm.addEventListener("keyup", handleChange);
    uploadImageForm.addEventListener("submit", handleImageUpload);
    removeImageBtn.addEventListener("click", handleDeleteImage);
    fields.image.addEventListener("change", handleImageChange);
    fields.imageLink.addEventListener("change", handleImageLinkChange);
    fields.imageLink.addEventListener("keyup", handleImageLinkChange);
});