document.addEventListener("DOMContentLoaded", function() {
    var logoutButton = document.getElementById("logout");
    var createPostBtn = document.getElementById("create-post-btn");
    var postModal = document.getElementById("post-modal");
    var postForm = document.getElementById("post-form");
    var postsContainer = document.getElementById("posts-container");
    var showAllPosts = document.getElementById("show-all-posts");
    var showFollowingPosts = document.getElementById("show-following-posts");
    var showMyPosts = document.getElementById("show-my-posts");
    var editPostModal = document.getElementById("edit-post-modal");
    var editPostForm = document.getElementById("edit-post-form");
    var userId; // This variable will store the user ID

    // Handle logout button click
    logoutButton.onclick = function(event) {
        event.preventDefault();
        // Redirect to the login page
        window.location.href = "index.html";
    }

    // Show the post modal when the create post button is clicked
    createPostBtn.onclick = function(event) {
        event.preventDefault();
        postModal.style.display = "block";
    }

    // Handle post form submission
    postForm.onsubmit = function(event) {
        event.preventDefault();
        var postTitle = document.getElementById("post-title").value;
        var postContent = document.getElementById("post-content").value;
        var postTags = document.getElementById("post-tags").value.split(',').map(tag => tag.trim());

        fetch('/create-post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: postTitle, content: postContent, tags: postTags })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadAllPosts();
                postModal.style.display = "none";
            } else {
                alert(data.error);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // Handle edit post form submission
    editPostForm.onsubmit = function(event) {
        event.preventDefault();
        var postId = document.getElementById("edit-post-id").value;
        var postTitle = document.getElementById("edit-post-title").value;
        var postContent = document.getElementById("edit-post-content").value;
        var postTags = document.getElementById("edit-post-tags").value.split(',').map(tag => tag.trim());

        fetch(`/edit-post/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: postTitle, content: postContent, tags: postTags })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadMyPosts();
                editPostModal.style.display = "none";
            } else {
                alert(data.error);
            }
        })
        .catch(error => console.error('Error:', error));
    }

    // Close the modal when clicking outside of the modal content
    window.onclick = function(event) {
        if (event.target === postModal) {
            postModal.style.display = "none";
        }
        if (event.target === editPostModal) {
            editPostModal.style.display = "none";
        }
    }

    // Load all posts
    function loadAllPosts() {
        fetch('/posts')
            .then(response => response.json())
            .then(data => {
                postsContainer.innerHTML = '';
                data.forEach(post => {
                    var postElement = document.createElement("div");
                    postElement.className = "post";
                    postElement.innerHTML = `
                        <h3>${post.title}</h3>
                        <p>${post.content}</p>
                        <p><strong>Автор:</strong> ${post.username}</p>
                        <div class="post-actions">
                            ${post.userId !== userId ? `
                            <button class="follow-btn" data-id="${post.userId}">Подписаться</button>
                            ` : ''}
                            <button class="comment-btn" data-id="${post.id}">Комментировать</button>
                        </div>
                        <div class="comment-section" id="comment-section-${post.id}"></div>
                        <div class="comment-form" id="comment-form-${post.id}" style="display: none;">
                            <textarea id="comment-content-${post.id}" rows="3" placeholder="Написать комментарий..."></textarea>
                            <button class="submit-comment-btn" data-id="${post.id}">Отправить</button>
                        </div>
                    `;
                    postsContainer.appendChild(postElement);
                });

                // Attach event listeners to the follow buttons
                var followButtons = document.querySelectorAll(".follow-btn");
                var commentButtons = document.querySelectorAll(".comment-btn");
                var submitCommentButtons = document.querySelectorAll(".submit-comment-btn");

                followButtons.forEach(button => {
                    button.onclick = function(event) {
                        var userIdToFollow = event.target.getAttribute("data-id");

                        fetch('/follow', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ userIdToFollow })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert("Подписка успешна");
                                loadAllPosts(); // Refresh the posts to update the button
                            } else {
                                alert(data.error);
                            }
                        })
                        .catch(error => console.error('Error:', error));
                    }
                });

                commentButtons.forEach(button => {
                    button.onclick = function(event) {
                        var postId = event.target.getAttribute("data-id");
                        var commentForm = document.getElementById(`comment-form-${postId}`);
                        commentForm.style.display = commentForm.style.display === 'none' ? 'block' : 'none';
                    }
                });

                submitCommentButtons.forEach(button => {
                    button.onclick = function(event) {
                        var postId = event.target.getAttribute("data-id");
                        var commentContent = document.getElementById(`comment-content-${postId}`).value;

                        fetch('/add-comment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ postId, content: commentContent })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                loadComments(postId);
                                document.getElementById(`comment-content-${postId}`).value = '';
                            } else {
                                alert(data.error);
                            }
                        })
                        .catch(error => console.error('Error:', error));
                    }
                });
            })
            .catch(error => console.error('Error:', error));
    }

    // Load comments for a post
    function loadComments(postId) {
        fetch(`/comments/${postId}`)
            .then(response => response.json())
            .then(data => {
                var commentSection = document.getElementById(`comment-section-${postId}`);
                commentSection.innerHTML = '';
                data.forEach(comment => {
                    var commentElement = document.createElement("div");
                    commentElement.className = "comment";
                    commentElement.innerHTML = `
                        <p><strong>${comment.username}:</strong> ${comment.content}</p>
                    `;
                    commentSection.appendChild(commentElement);
                });
            })
            .catch(error => console.error('Error:', error));
    }

    // Load my posts
    function loadMyPosts() {
        fetch('/my-posts')
            .then(response => response.json())
            .then(data => {
                postsContainer.innerHTML = '';
                data.forEach(post => {
                    var postElement = document.createElement("div");
                    postElement.className = "post";
                    postElement.innerHTML = `
                        <h3>${post.title}</h3>
                        <p>${post.content}</p>
                        <div class="post-actions">
                            <button class="edit-btn" data-id="${post.id}" data-title="${post.title}" data-content="${post.content}" data-tags="${post.tags}">Редактировать</button>
                            <button class="delete-btn" data-id="${post.id}">Удалить</button>
                        </div>
                    `;
                    postsContainer.appendChild(postElement);
                });

                // Attach event listeners to the edit and delete buttons
                var editButtons = document.querySelectorAll(".edit-btn");
                var deleteButtons = document.querySelectorAll(".delete-btn");

                editButtons.forEach(button => {
                    button.onclick = function(event) {
                        var postId = event.target.getAttribute("data-id");
                        var postTitle = event.target.getAttribute("data-title");
                        var postContent = event.target.getAttribute("data-content");
                        var postTags = event.target.getAttribute("data-tags");

                        document.getElementById("edit-post-id").value = postId;
                        document.getElementById("edit-post-title").value = postTitle;
                        document.getElementById("edit-post-content").value = postContent;
                        document.getElementById("edit-post-tags").value = postTags;

                        editPostModal.style.display = "block";
                    }
                });

                deleteButtons.forEach(button => {
                    button.onclick = function(event) {
                        var postId = event.target.getAttribute("data-id");

                        if (confirm("Вы уверены, что хотите удалить этот пост?")) {
                            fetch(`/delete-post/${postId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    loadMyPosts();
                                } else {
                                    alert(data.error);
                                }
                            })
                            .catch(error => console.error('Error:', error));
                        }
                    }
                });
            })
            .catch(error => console.error('Error:', error));
    }

    // Load following posts
    function loadFollowingPosts() {
        fetch('/following-posts')
            .then(response => response.json())
            .then(data => {
                postsContainer.innerHTML = '';
                data.forEach(post => {
                    var postElement = document.createElement("div");
                    postElement.className = "post";
                    postElement.innerHTML = `
                        <h3>${post.title}</h3>
                        <p>${post.content}</p>
                        <p><strong>Автор:</strong> ${post.username}</p>
                        <div class="post-actions">
                            <button class="comment-btn" data-id="${post.id}">Комментировать</button>
                        </div>
                        <div class="comment-section" id="comment-section-${post.id}"></div>
                        <div class="comment-form" id="comment-form-${post.id}" style="display: none;">
                            <textarea id="comment-content-${post.id}" rows="3" placeholder="Написать комментарий..."></textarea>
                            <button class="submit-comment-btn" data-id="${post.id}">Отправить</button>
                        </div>
                    `;
                    postsContainer.appendChild(postElement);
                });

                var commentButtons = document.querySelectorAll(".comment-btn");
                var submitCommentButtons = document.querySelectorAll(".submit-comment-btn");

                commentButtons.forEach(button => {
                    button.onclick = function(event) {
                        var postId = event.target.getAttribute("data-id");
                        var commentForm = document.getElementById(`comment-form-${postId}`);
                        commentForm.style.display = commentForm.style.display === 'none' ? 'block' : 'none';
                    }
                });

                submitCommentButtons.forEach(button => {
                    button.onclick = function(event) {
                        var postId = event.target.getAttribute("data-id");
                        var commentContent = document.getElementById(`comment-content-${postId}`).value;

                        fetch('/add-comment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ postId, content: commentContent })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                loadComments(postId);
                                document.getElementById(`comment-content-${postId}`).value = '';
                            } else {
                                alert(data.error);
                            }
                        })
                        .catch(error => console.error('Error:', error));
                    }
                });
            })
            .catch(error => console.error('Error:', error));
    }

    // Show all posts when clicking on "Главная"
    showAllPosts.onclick = function(event) {
        event.preventDefault();
        loadAllPosts();
    }

    // Show following posts when clicking on "Подписки"
    showFollowingPosts.onclick = function(event) {
        event.preventDefault();
        loadFollowingPosts();
    }

    // Show my posts when clicking on "Мои посты"
    showMyPosts.onclick = function(event) {
        event.preventDefault();
        loadMyPosts();
    }

    // Fetch user ID
    fetch('/user-id')
        .then(response => response.json())
        .then(data => {
            userId = data.userId;
            // Load all posts by default
            loadAllPosts();
        })
        .catch(error => console.error('Error:', error));
});
