document.addEventListener("DOMContentLoaded", () => {
  const resumeInput = document.getElementById("resume")
  const jobDescInput = document.getElementById("job-description")
  const resumeInfo = document.getElementById("resume-info")
  const jobDescInfo = document.getElementById("job-desc-info")
  const resumeUpload = document.getElementById("resume-upload")
  const jobDescUpload = document.getElementById("job-desc-upload")
  const uploadForm = document.getElementById("upload-form")
  const loadingSection = document.getElementById("loading-section")
  const resultsSection = document.getElementById("results-section")
  const uploadSection = document.getElementById("upload-section")
  const submitBtn = document.getElementById("submit-btn")
  const percentageValue = document.getElementById("percentage-value")
  const matchMessage = document.getElementById("match-message")
  const resumeSkillsCount = document.getElementById("resume-skills-count")
  const jobSkillsCount = document.getElementById("job-skills-count")
  const matchingSkillsCount = document.getElementById("matching-skills-count")
  const missingSkillsCount = document.getElementById("missing-skills-count")
  const matchingSkillsGrid = document.getElementById("matching-skills-grid")
  const missingSkillsGrid = document.getElementById("missing-skills-grid")
  const resumeSkillsGrid = document.getElementById("resume-skills-grid")
  const chartButtons = document.querySelectorAll(".chart-btn")
  const vennView = document.getElementById("skills-venn-view")
  const resumeCount = document.getElementById("resume-count")
  const jobCount = document.getElementById("job-count")
  const matchCount = document.getElementById("match-count")
  const jobSkillsGrid = document.getElementById("job-skills-grid")
  const suggestionsList = document.getElementById("suggestions-list")
  const tabBtns = document.querySelectorAll(".tab-btn")
  const tabPanes = document.querySelectorAll(".tab-pane")

  function showFileDetails(input, infoBox, uploadBox) {
    input.addEventListener("change", () => {
      const file = input.files[0]
      if (file) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
        infoBox.innerHTML = `<strong>${file.name}</strong><br><span>${fileSizeMB} MB</span>`
        uploadBox.classList.add("active")
      } else {
        infoBox.textContent = ""
        uploadBox.classList.remove("active")
      }
    })
  }

  showFileDetails(resumeInput, resumeInfo, resumeUpload)
  showFileDetails(jobDescInput, jobDescInfo, jobDescUpload)

  function setupTabs() {
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"))
        tabPanes.forEach((p) => p.classList.remove("active"))
        btn.classList.add("active")
        const tabId = btn.getAttribute("data-tab")
        const tabPane = document.getElementById(`${tabId}-tab`)
        if (tabPane) tabPane.classList.add("active")
      })
    })

    if (tabBtns.length > 0) tabBtns[0].click()
  }

  setupTabs()

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const resumeFile = resumeInput.files[0]
    const jobFile = jobDescInput.files[0]
    if (!resumeFile || !jobFile) {
      alert("Please upload both Resume and Job Description.")
      return
    }

    const formData = new FormData()
    formData.append("resume", resumeFile)
    formData.append("job_description", jobFile)

    uploadSection.classList.add("hidden")
    loadingSection.classList.remove("hidden")
    submitBtn.disabled = true

    try {
      const response = await fetch("https://resumeanalyzer-a7me.onrender.com/analyze", {
        method: "POST",
        body: formData
      })

      if (!response.ok) throw new Error("Server error")

      const data = await response.json()

      setTimeout(() => {
        displayResults(data)
        loadingSection.classList.add("hidden")
        resultsSection.classList.remove("hidden")
        submitBtn.disabled = false
      }, 2000)
    } catch (err) {
      alert("Error: " + err.message)
      loadingSection.classList.add("hidden")
      uploadSection.classList.remove("hidden")
      submitBtn.disabled = false
    }
  })

  
function displayResults(data) {
  const matchPercentage = Math.round(data.match_percentage)
  percentageValue.textContent = `${matchPercentage}%`
  const progress = document.querySelector(".circular-progress")
  if (progress)
    progress.style.background = `conic-gradient(var(--primary-color) ${matchPercentage}%, #f3f4f6 0%)`

  if (matchPercentage < 40) {
    matchMessage.textContent = "Your resume is a poor match for this job"
    percentageValue.style.color = "var(--danger-color)"
    matchMessage.style.color = "var(--danger-color)"
  } else if (matchPercentage < 70) {
    matchMessage.textContent = "Your resume is a moderate match for this job"
    percentageValue.style.color = "var(--warning-color)"
    matchMessage.style.color = "var(--warning-color)"
  } else {
    matchMessage.textContent = "Your resume is a good match for this job"
    percentageValue.style.color = "var(--secondary-color)"
    matchMessage.style.color = "var(--secondary-color)"
  }

  resumeSkillsCount.textContent = data.skill_count.resume
  jobSkillsCount.textContent = data.skill_count.job_description
  matchingSkillsCount.textContent = data.skill_count.matching
  missingSkillsCount.textContent = data.skill_count.missing

  renderSkillsChart("pie", data)

  chartButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      chartButtons.forEach((b) => b.classList.remove("active"))
      btn.classList.add("active")
      renderSkillsChart(btn.dataset.type, data)
    })
  )

  createSkillTags(data.matching_skills, matchingSkillsGrid, "matching")
  createSkillTags(data.missing_skills, missingSkillsGrid, "missing")
  createSkillTags(data.resume_skills, resumeSkillsGrid, "resume")
  createSkillTags(data.job_required_skills, jobSkillsGrid, "job")
  generateSuggestions(data)
  setupTabs()
}

function renderSkillsChart(type, data) {
  const ctx = document.getElementById("skills-chart").getContext("2d")
  if (window.skillsChart) window.skillsChart.destroy()

  const chartCanvas = document.getElementById("skills-chart")
  const dataset = {
    labels: ["Resume Skills", "Job Skills", "Matching", "Missing"],
    data: [
      data.skill_count.resume,
      data.skill_count.job_description,
      data.skill_count.matching,
      data.skill_count.missing
    ]
  }

  chartCanvas.classList.add("hidden")
  vennView.classList.add("hidden")

  if (false) {
    badgeView.classList.remove("hidden")
    badgeView.innerHTML = ""
    const allSkills = new Set([...data.resume_skills, ...data.job_required_skills])
    allSkills.forEach((skill) => {
      const div = document.createElement("div")
      div.className = "badge"
      if (data.matching_skills.includes(skill)) div.classList.add("match")
      else if (data.missing_skills.includes(skill)) div.classList.add("missing")
      else if (data.resume_skills.includes(skill)) div.classList.add("resume-only")
      else div.classList.add("job-only")
      div.textContent = skill
      badgeView.appendChild(div)
    })
    return
  }

  if (type === "venn") {
    vennView.classList.remove("hidden")
    resumeCount.textContent = dataset.data[0]
    jobCount.textContent = dataset.data[1]
    matchCount.textContent = dataset.data[2]
    return
  }

  chartCanvas.classList.remove("hidden")
  const chartType = type === "bar" ? "bar" : "pie"
  window.skillsChart = new Chart(ctx, {
    type: chartType,
    data: {
      labels: dataset.labels,
      datasets: [{
        label: "Skill Stats",
        data: dataset.data,
        backgroundColor: ["#6366f1", "#f59e0b", "#10b981", "#ef4444"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: chartType === "pie", position: "bottom" }
      }
    }
  })
}
function createSkillTags(skills, container, type) {
    container.innerHTML = ""
    if (!skills || skills.length === 0) {
      const p = document.createElement("p")
      p.textContent = "No skills found."
      container.appendChild(p)
      return
    }
    for (const skill of skills) {
      const div = document.createElement("div")
      div.className = "skill-tag"
      let icon = "fa-tag"
      if (type === "matching") icon = "fa-check"
      else if (type === "missing") icon = "fa-times"
      else if (type === "resume") icon = "fa-file-alt"
      else if (type === "job") icon = "fa-briefcase"
      div.innerHTML = `<i class="fas ${icon}"></i> ${skill}`
      container.appendChild(div)
    }
  }

  function generateSuggestions(data) {
    suggestionsList.innerHTML = ""
    if (data.match_percentage < 70) {
      const li = document.createElement("li")
      li.textContent = "Improve your resume by adding missing skills and matching more keywords."
      suggestionsList.appendChild(li)
    }
    if (data.missing_skills.length > 0) {
      const li = document.createElement("li")
      li.textContent = `Consider adding: ${data.missing_skills.slice(0, 5).join(", ")}.`
      suggestionsList.appendChild(li)
    }
  }
}) 