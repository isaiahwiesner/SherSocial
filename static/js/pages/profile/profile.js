const postsContainer = document.getElementById("posts");
const followBtn = document.getElementById("follow");
const unfollowBtn = document.getElementById("unfollow");

var resultData = {};

const fetchPosts = async (page) => {
    const res = await fetch(`/shersocial/api/users/posts?userId=${user.userId}&page=${page}`);
    if (res.ok) {
        const data = await res.json();
        resultData.page = data.page;
        resultData.pages = data.pages;
        appendPosts(data.posts)
    }
};

const appendPosts = (posts) => {
    if (resultData.page === 1 && posts.length === 0) {
        postsContainer.innerHTML += `<h5 class="text-center p-0">This user has no posts.</h5>`;
    }
    else {
        if (document.getElementById("load-more-posts")) {
            document.getElementById("load-more-posts").remove();
        }
        var postsInnerHTML = "";
        posts.forEach(p => {
            if (p.image) {
                postsInnerHTML += `<a href="/shersocial/posts/${p.postId}" role="button" class="card text-decoration-none overflow-hidden">
                    <img src="${p.image}" alt="${p.title}" class="object-fit-cover" style="height: 12rem;">
                    <hr class="hr m-0">
                    <section class="card-body">
                        <h4 class="m-0">${p.title}</h4>
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
                        <h4 class="m-0">${p.title}</h4>
                        <p class="text-secondary m-0">
                        ${p.timeSince} | ${p.privacy === "public"
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

const handleFollow = async () => {
    if (!authUser) {
        window.location = `/shersocial/login?redirect=${encodeURIComponent(genPath.slice(1))}`;
    }
    else {
        followBtn.setAttribute("loading", "true");
        const res = await fetch(`/shersocial/api/users/follow?userId=${user.userId}`, {
            method: "POST"
        });
        if (res.ok) {
            window.location.reload();
        }
        else {
            followBtn.removeAttribute("disabled");
        }
    }
};

const handleUnfollow = async () => {
    unfollowBtn.setAttribute("loading", "true");
    const res = await fetch(`/shersocial/api/users/unfollow?userId=${user.userId}`, {
        method: "POST"
    });
    if (res.ok) {
        window.location.reload();
    }
    else {
        unfollowBtn.removeAttribute("disabled");
    }
};

document.addEventListener("DOMContentLoaded", () => {
    fetchPosts(1);
    if (followBtn) followBtn.addEventListener("click", handleFollow);
    if (unfollowBtn) unfollowBtn.addEventListener("click", handleUnfollow);
});