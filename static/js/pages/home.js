const postsContainer = document.getElementById("posts");

var resultData = {};

const fetchPosts = async (page) => {
    const res = await fetch(`/shersocial/api/posts?page=${page}`);
    if (res.ok) {
        const data = await res.json();
        resultData.page = data.page;
        resultData.pages = data.pages;
        appendPosts(data.posts);
    }
};

const appendPosts = (posts) => {
    if (resultData.page === 1 && posts.length === 0) {
        postsContainer.innerHTML += `<h5 class="text-center p-0">There are currently no posts. Be the first!</h5>`;
    }
    else {
        if (document.getElementById("load-more-posts")) {
            document.getElementById("load-more-posts").remove();
        }
        var postsInnerHTML = "";
        posts.forEach(p => {
            console.log(p)
            if (p.image) {
                postsInnerHTML += `<a href="/shersocial/posts/${p.postId}" role="button" class="card text-decoration-none overflow-hidden">
                    <img src="${p.image}" alt="${p.title}" class="object-fit-cover" style="height: 12rem;">
                    <hr class="hr m-0">
                    <section class="card-body">
                        <h4 class="mb-2">${p.title}</h4>
                        <section class="d-flex gap-3 align-items-center mb-2">
                            ${p.creatorImage
                        ? `<img src="${p.creatorImage}" class="rounded-circle avatar object-fit-cover" alt="${p.creatorFullName}">`
                        : `<svg xmlns="http://www.w3.org/2000/svg" class="rounded-circle avatar" viewBox="0 0 448 512">
                                <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
                                <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z" />
                              </svg>`}
                            ${p.creatorFullName} (@${p.creatorUsername})
                        </section>
                        <p class="text-secondary m-0">
                        ${p.timeSince} | ${p.privacy === "public"
                        ? 'Public <i class="fa-solid fa-globe"></i>' : p.privacy === "members"
                            ? 'Members Only <i class="fa-solid fa-user"></i>'
                            : 'Private <i class="fa-solid fa-lock"></i>'}
                        </p>
                    </section>
                </a>`;
            }
            else {
                postsInnerHTML += `<a href="/shersocial/posts/${p.postId}" role="button" class="card text-decoration-none overflow-hidden">
                    <section class="card-body">
                        <h4 class="mb-2">${p.title}</h4>
                        <section class="d-flex gap-3 align-items-center mb-2">
                            ${p.creatorImage
                        ? `<img src="${p.creatorImage}" class="rounded-circle avatar object-fit-cover" alt="${p.creatorFullName}">`
                        : `<svg xmlns="http://www.w3.org/2000/svg" class="rounded-circle avatar" viewBox="0 0 448 512">
                                <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
                                <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z" />
                              </svg>`}
                            ${p.creatorFullName} (@${p.creatorUsername})
                        </section>
                        <p class="text-secondary m-0">
                        ${p.privacy === "public"
                        ? 'Public <i class="fa-solid fa-globe"></i>' : p.privacy === "members"
                            ? 'Members Only <i class="fa-solid fa-user"></i>'
                            : 'Private <i class="fa-solid fa-lock"></i>'}
                        </p>
                    </section>
                </a>`;
            }
        });
        postsContainer.innerHTML += postsInnerHTML;
        if (resultData.page < resultData.pages) {
            postsContainer.innerHTML += `<a class="text-center" role="button" id="load-more-posts">Load more</a>`;
            document.getElementById("load-more-posts").addEventListener("click", () => fetchPosts(resultData.page + 1));
        };
    }
};

document.addEventListener("DOMContentLoaded", () => {
    fetchPosts(1);
});