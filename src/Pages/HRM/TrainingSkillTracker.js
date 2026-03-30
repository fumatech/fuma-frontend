import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faBook,
    faGraduationCap,
    faCertificate,
    faUserCheck,
    faExclamationTriangle,
    faChartBar,
    faPlayCircle,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";

const BASE_URL = process.env.REACT_APP_BASE_URL;
const MODULES_KEY = "hrm_training_modules_v1";
const SKILLS_KEY = "hrm_employee_skills_v1";
const CERTS_KEY = "hrm_employee_certs_v1";

const VIDEO_LESSON_CATALOG = [
    { title: "Java Full Course for Beginners", url: "https://www.youtube.com/watch?v=eIrMbAQSU34", source: "Programming with Mosh", tags: ["java", "backend", "oop"], category: "Technical" },
    { title: "Java Tutorial for Beginners", url: "https://www.youtube.com/watch?v=UmnCZ7-9yDY", source: "Bro Code", tags: ["java", "core java"], category: "Technical" },
    { title: "Spring Boot Crash Course", url: "https://www.youtube.com/watch?v=9SGDpanrc8U", source: "Amigoscode", tags: ["java", "spring", "backend"], category: "Technical" },
    { title: "Python for Beginners - Full Course", url: "https://www.youtube.com/watch?v=_uQrJ0TkZlc", source: "Programming with Mosh", tags: ["python", "pyhon", "backend", "automation"], category: "Technical" },
    { title: "Python Tutorial - Python Full Course for Beginners", url: "https://www.youtube.com/watch?v=rfscVS0vtbw", source: "freeCodeCamp.org", tags: ["python", "data", "beginner"], category: "Technical" },
    { title: "AWS Certified Cloud Practitioner Training", url: "https://www.youtube.com/watch?v=3hLmDS179YE", source: "freeCodeCamp.org", tags: ["aws", "cloud", "devops"], category: "Technical" },
    { title: "AWS Tutorial for Beginners", url: "https://www.youtube.com/watch?v=ulprqHHWlng", source: "Simplilearn", tags: ["aws", "cloud", "architecture"], category: "Technical" },
    { title: "Docker Tutorial for Beginners", url: "https://www.youtube.com/watch?v=fqMOX6JJhGo", source: "TechWorld with Nana", tags: ["docker", "devops", "containers"], category: "Technical" },
    { title: "Kubernetes Course for Beginners", url: "https://www.youtube.com/watch?v=X48VuDVv0do", source: "TechWorld with Nana", tags: ["kubernetes", "k8s", "devops"], category: "Technical" },
    { title: "Node.js and Express.js Full Course", url: "https://www.youtube.com/watch?v=Oe421EPjeBE", source: "freeCodeCamp.org", tags: ["node", "nodejs", "backend", "api"], category: "Technical" },
    { title: "SQL Tutorial - Full Database Course", url: "https://www.youtube.com/watch?v=HXV3zeQKqGY", source: "freeCodeCamp.org", tags: ["sql", "database", "mysql", "postgres"], category: "Technical" },
    { title: "Git and GitHub for Beginners", url: "https://www.youtube.com/watch?v=RGOj5yH7evk", source: "freeCodeCamp.org", tags: ["git", "github", "version control"], category: "Technical" },
    { title: "TypeScript Course for Beginners", url: "https://www.youtube.com/watch?v=30LWjhZzg50", source: "Programming with Mosh", tags: ["typescript", "javascript", "frontend", "backend"], category: "Technical" },
    { title: "React Crash Course", url: "https://www.youtube.com/watch?v=w7ejDZ8SWv8", source: "Traversy Media", tags: ["react", "frontend", "javascript"], category: "Technical" },
    { title: "JavaScript in 100 Seconds", url: "https://www.youtube.com/watch?v=DHjqpvDnNGE", source: "Fireship", tags: ["javascript", "frontend"], category: "Technical" },
    { title: "Machine Learning Full Course", url: "https://www.youtube.com/watch?v=NWONeJKn6kc", source: "freeCodeCamp.org", tags: ["machine learning", "ai", "python", "data science"], category: "Technical" },
    { title: "Power BI Full Course", url: "https://www.youtube.com/watch?v=AGrl-H87pRU", source: "Simplilearn", tags: ["power bi", "analytics", "dashboard", "data"], category: "Technical" },
    { title: "Workplace Safety Basics", url: "https://www.youtube.com/watch?v=KehANf2By5s", source: "SafetyVideos.com", tags: ["safety", "compliance"], category: "Compliance" },
    { title: "GDPR Explained", url: "https://www.youtube.com/watch?v=Sidm3LxhlmQ", source: "European Commission", tags: ["gdpr", "compliance", "privacy"], category: "Compliance" },
    { title: "Situational Leadership", url: "https://www.youtube.com/watch?v=USYQ20c8M4A", source: "MindToolsVideos", tags: ["leadership", "management"], category: "Leadership" },
    { title: "How Great Leaders Inspire Action", url: "https://www.youtube.com/watch?v=qp0HIF3SfI4", source: "TED", tags: ["leadership", "communication"], category: "Leadership" },
    { title: "Effective Communication Skills", url: "https://www.youtube.com/watch?v=HAnw168huqA", source: "HBR", tags: ["communication", "soft skills"], category: "Soft Skills" },
    { title: "Conflict Resolution at Work", url: "https://www.youtube.com/watch?v=KY5TWVz5ZDU", source: "Mediation Channel", tags: ["conflict", "soft skills"], category: "Soft Skills" },
    { title: "Product Management 101", url: "https://www.youtube.com/watch?v=502ILHjX9EE", source: "Product School", tags: ["product", "pm"], category: "Product" },
];

const QUERY_ALIASES = {
    pyhon: "python",
    javscript: "javascript",
    reactjs: "react",
    nodejs: "node",
    awscloud: "aws",
    k8: "k8s",
};

const CATEGORY_VIDEO_LIBRARY = {
    Technical: VIDEO_LESSON_CATALOG.filter((v) => v.category === "Technical"),
    Compliance: VIDEO_LESSON_CATALOG.filter((v) => v.category === "Compliance"),
    Leadership: VIDEO_LESSON_CATALOG.filter((v) => v.category === "Leadership"),
    "Soft Skills": VIDEO_LESSON_CATALOG.filter((v) => v.category === "Soft Skills"),
    Product: VIDEO_LESSON_CATALOG.filter((v) => v.category === "Product"),
};

const getYoutubeEmbedUrl = (url) => {
    if (!url) return "";
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    return "";
};

const safeParse = (value, fallback = []) => {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
};

const readLocal = () => ({
    modules: safeParse(localStorage.getItem(MODULES_KEY), []),
    skills: safeParse(localStorage.getItem(SKILLS_KEY), []),
    certs: safeParse(localStorage.getItem(CERTS_KEY), []),
});

const saveLocal = ({ modules, skills, certs }) => {
    localStorage.setItem(MODULES_KEY, JSON.stringify(modules || []));
    localStorage.setItem(SKILLS_KEY, JSON.stringify(skills || []));
    localStorage.setItem(CERTS_KEY, JSON.stringify(certs || []));
};

const TrainingSkillTracker = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modules, setModules] = useState([]);
    const [skills, setSkills] = useState([]);
    const [certs, setCerts] = useState([]);

    const [moduleForm, setModuleForm] = useState({
        title: "",
        category: "Technical",
        skillsCovered: "",
        dueDate: "",
        mandatory: true,
        assignedEmployees: [],
        description: "",
        videoLessonUrl: "",
    });
    const [videoSearchTerm, setVideoSearchTerm] = useState("");
    const [showVideoSuggestions, setShowVideoSuggestions] = useState(false);
    const videoSuggestWrapRef = useRef(null);

    const [skillForm, setSkillForm] = useState({
        employeeId: "",
        skillName: "",
        level: "Beginner",
        lastAssessed: "",
    });

    const [certForm, setCertForm] = useState({
        employeeId: "",
        certificateName: "",
        issuer: "",
        issueDate: "",
        expiryDate: "",
    });

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${BASE_URL}/user/getall`);
                setEmployees(res.data || []);
            } catch (err) {
                console.error("Failed to load employees:", err);
                toast.error("Failed to load employees");
            }
            const store = readLocal();
            setModules(store.modules);
            setSkills(store.skills);
            setCerts(store.certs);
            setLoading(false);
        };

        load();
    }, []);

    const getEmployeeName = (id) => {
        const emp = employees.find((e) => String(e.id) === String(id));
        return emp ? `${emp.firstname || ""} ${emp.lastname || ""}`.trim() : `Emp #${id}`;
    };

    const resetModuleForm = () =>
        setModuleForm({
            title: "",
            category: "Technical",
            skillsCovered: "",
            dueDate: "",
            mandatory: true,
            assignedEmployees: [],
            description: "",
            videoLessonUrl: "",
        });

    useEffect(() => {
        const onDocClick = (evt) => {
            if (!videoSuggestWrapRef.current) return;
            if (!videoSuggestWrapRef.current.contains(evt.target)) {
                setShowVideoSuggestions(false);
            }
        };

        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const videoSuggestions = useMemo(() => {
        const rawQuery = videoSearchTerm.trim().toLowerCase();
        const query = QUERY_ALIASES[rawQuery] || rawQuery;
        if (!query) {
            return (CATEGORY_VIDEO_LIBRARY[moduleForm.category] || []).slice(0, 6);
        }
        const queryTokens = query.split(/\s+/).filter(Boolean);

        const scoreVideo = (video) => {
            const title = (video.title || "").toLowerCase();
            const source = (video.source || "").toLowerCase();
            const tags = (video.tags || []).map((t) => String(t).toLowerCase());
            if (title === query) return 100;
            if (title.startsWith(query)) return 80;
            if (tags.some((tag) => tag === query)) return 70;
            if (title.includes(query)) return 60;
            if (tags.some((tag) => tag.includes(query))) return 50;
            if (queryTokens.length > 1 && queryTokens.every((t) => `${title} ${tags.join(" ")}`.includes(t))) return 45;
            if (source.includes(query)) return 40;
            return 10;
        };

        return VIDEO_LESSON_CATALOG
            .filter((v) => {
                const hay = `${v.title} ${v.source} ${(v.tags || []).join(" ")}`.toLowerCase();
                return hay.includes(query) || queryTokens.some((t) => hay.includes(t));
            })
            .sort((a, b) => scoreVideo(b) - scoreVideo(a))
            .slice(0, 8);
    }, [videoSearchTerm, moduleForm.category]);

    const selectedVideo = useMemo(
        () => VIDEO_LESSON_CATALOG.find((v) => v.url === moduleForm.videoLessonUrl) || null,
        [moduleForm.videoLessonUrl]
    );

    const selectedVideoEmbed = useMemo(
        () => getYoutubeEmbedUrl(moduleForm.videoLessonUrl),
        [moduleForm.videoLessonUrl]
    );

    const handleAssignModule = (e) => {
        e.preventDefault();
        if (!moduleForm.title || moduleForm.assignedEmployees.length === 0) {
            toast.warning("Please enter module title and assign at least one employee");
            return;
        }

        const now = new Date().toISOString();
        const skillTags = moduleForm.skillsCovered
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        const newModule = {
            id: Date.now(),
            title: moduleForm.title.trim(),
            category: moduleForm.category,
            description: moduleForm.description.trim(),
            skillsCovered: skillTags,
            dueDate: moduleForm.dueDate || null,
            mandatory: !!moduleForm.mandatory,
            videoLessonUrl: moduleForm.videoLessonUrl?.trim() || "",
            createdAt: now,
            assignees: moduleForm.assignedEmployees.map((empId) => ({
                employeeId: Number(empId),
                status: "NOT_STARTED",
                progress: 0,
                completedAt: null,
                lastUpdated: now,
            })),
        };

        const updatedModules = [newModule, ...modules];
        setModules(updatedModules);
        saveLocal({ modules: updatedModules, skills, certs });
        resetModuleForm();
        setVideoSearchTerm("");
        setShowVideoSuggestions(false);
        toast.success("Training module assigned successfully");
    };

    const handleAddSkill = (e) => {
        e.preventDefault();
        if (!skillForm.employeeId || !skillForm.skillName) {
            toast.warning("Please select employee and enter skill");
            return;
        }
        const updated = [
            {
                id: Date.now(),
                employeeId: Number(skillForm.employeeId),
                skillName: skillForm.skillName.trim(),
                level: skillForm.level,
                lastAssessed: skillForm.lastAssessed || null,
            },
            ...skills,
        ];
        setSkills(updated);
        saveLocal({ modules, skills: updated, certs });
        setSkillForm({ employeeId: "", skillName: "", level: "Beginner", lastAssessed: "" });
        toast.success("Skill record added");
    };

    const handleAddCertification = (e) => {
        e.preventDefault();
        if (!certForm.employeeId || !certForm.certificateName || !certForm.issuer) {
            toast.warning("Please fill employee, certificate name, and issuer");
            return;
        }
        const updated = [
            {
                id: Date.now(),
                employeeId: Number(certForm.employeeId),
                certificateName: certForm.certificateName.trim(),
                issuer: certForm.issuer.trim(),
                issueDate: certForm.issueDate || null,
                expiryDate: certForm.expiryDate || null,
            },
            ...certs,
        ];
        setCerts(updated);
        saveLocal({ modules, skills, certs: updated });
        setCertForm({ employeeId: "", certificateName: "", issuer: "", issueDate: "", expiryDate: "" });
        toast.success("Certification record added");
    };

    const moduleStats = useMemo(() => {
        const totalModules = modules.length;
        let totalAssignments = 0;
        let completedAssignments = 0;
        let mandatoryAssignments = 0;

        modules.forEach((m) => {
            const assignees = m.assignees || [];
            totalAssignments += assignees.length;
            completedAssignments += assignees.filter((a) => a.status === "COMPLETED").length;
            if (m.mandatory) mandatoryAssignments += assignees.length;
        });

        return {
            totalModules,
            totalAssignments,
            completedAssignments,
            completionRate: totalAssignments ? Math.round((completedAssignments / totalAssignments) * 100) : 0,
            mandatoryAssignments,
        };
    }, [modules]);

    const skillGapRows = useMemo(() => {
        return employees.map((emp) => {
            const empAssignedMandatory = modules.filter(
                (m) => m.mandatory && (m.assignees || []).some((a) => Number(a.employeeId) === Number(emp.id))
            );
            const requiredSkills = new Set();
            empAssignedMandatory.forEach((m) => (m.skillsCovered || []).forEach((s) => requiredSkills.add(s.toLowerCase())));

            const employeeSkills = skills
                .filter((s) => Number(s.employeeId) === Number(emp.id))
                .map((s) => s.skillName.toLowerCase());

            const missing = [...requiredSkills].filter((r) => !employeeSkills.includes(r));
            return {
                employeeId: emp.id,
                employeeName: `${emp.firstname || ""} ${emp.lastname || ""}`.trim(),
                requiredCount: requiredSkills.size,
                gapCount: missing.length,
                missingSkills: missing,
            };
        });
    }, [employees, modules, skills]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2">Loading training tracker...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="row mb-3">
                {[
                    { label: "Training Modules", value: moduleStats.totalModules, color: "#4361ee", icon: faBook },
                    { label: "Assignments", value: moduleStats.totalAssignments, color: "#17a2b8", icon: faUserCheck },
                    { label: "Completion Rate", value: `${moduleStats.completionRate}%`, color: "#28a745", icon: faGraduationCap },
                    { label: "Mandatory", value: moduleStats.mandatoryAssignments, color: "#dc3545", icon: faExclamationTriangle },
                ].map((s, i) => (
                    <div className="col-lg-3 col-md-6 mb-3" key={i}>
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body d-flex align-items-center justify-content-between">
                                <div>
                                    <small className="text-muted">{s.label}</small>
                                    <h4 className="mb-0" style={{ color: s.color }}>{s.value}</h4>
                                </div>
                                <FontAwesomeIcon icon={s.icon} size="2x" style={{ color: s.color, opacity: 0.35 }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row">
                <div className="col-lg-7 mb-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0">
                            <h6 className="mb-0"><FontAwesomeIcon icon={faBook} className="mr-2 text-primary" />Assign Training Module</h6>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleAssignModule}>
                                <div className="row">
                                    <div className="col-md-8 form-group">
                                        <label>Module Title *</label>
                                        <input className="form-control" value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} />
                                    </div>
                                    <div className="col-md-4 form-group">
                                        <label>Category</label>
                                        <select className="form-control" value={moduleForm.category} onChange={(e) => setModuleForm({ ...moduleForm, category: e.target.value })}>
                                            <option>Technical</option>
                                            <option>Compliance</option>
                                            <option>Leadership</option>
                                            <option>Soft Skills</option>
                                            <option>Product</option>
                                        </select>
                                    </div>
                                    <div className="col-md-12 form-group">
                                        <label>Description</label>
                                        <textarea className="form-control" rows="2" value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} />
                                    </div>
                                    <div className="col-md-12 form-group">
                                        <label>Search Video Lesson</label>
                                        <div className="position-relative" ref={videoSuggestWrapRef}>
                                            <input
                                                className="form-control"
                                                placeholder="Type skill/topic e.g. java, react, leadership"
                                                value={videoSearchTerm}
                                                onChange={(e) => {
                                                    setVideoSearchTerm(e.target.value);
                                                    setShowVideoSuggestions(true);
                                                }}
                                                onFocus={() => setShowVideoSuggestions(true)}
                                            />
                                            {showVideoSuggestions && (
                                                <div
                                                    className="border rounded position-absolute bg-white w-100"
                                                    style={{ zIndex: 20, maxHeight: 220, overflowY: "auto" }}
                                                >
                                                    {videoSuggestions.length === 0 ? (
                                                        <div className="px-3 py-2 text-muted small">No video suggestions found</div>
                                                    ) : (
                                                        videoSuggestions.map((v, idx) => (
                                                            <button
                                                                key={`${v.url}-${idx}`}
                                                                type="button"
                                                                className="dropdown-item d-flex justify-content-between align-items-center"
                                                                onClick={() => {
                                                                    setModuleForm({ ...moduleForm, videoLessonUrl: v.url });
                                                                    setVideoSearchTerm(v.title);
                                                                    setShowVideoSuggestions(false);
                                                                }}
                                                            >
                                                                <span>{v.title}</span>
                                                                <small className="text-muted">{v.source}</small>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <small className="text-muted">Search topic and pick from top suggested lessons.</small>
                                    </div>
                                    <div className="col-md-12 form-group">
                                        <label>Selected Video Lesson</label>
                                        <div className="border rounded p-3 bg-light">
                                            {moduleForm.videoLessonUrl ? (
                                                <>
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <div className="font-weight-bold">{selectedVideo?.title || "Custom Video Lesson"}</div>
                                                            <small className="text-muted">{selectedVideo?.source || "External source"}</small>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => {
                                                                setModuleForm({ ...moduleForm, videoLessonUrl: "" });
                                                                setVideoSearchTerm("");
                                                            }}
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                    <a href={moduleForm.videoLessonUrl} target="_blank" rel="noreferrer" className="d-block mt-2">
                                                        Open lesson
                                                    </a>
                                                    {selectedVideoEmbed && (
                                                        <div className="mt-2" style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                                                            <iframe
                                                                title="Selected training lesson"
                                                                src={selectedVideoEmbed}
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                                frameBorder="0"
                                                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                                                            />
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <small className="text-muted">Search and select a suggested video lesson from the dropdown.</small>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-8 form-group">
                                        <label>Skills Covered (comma separated)</label>
                                        <input className="form-control" placeholder="React, Communication, Data Analysis" value={moduleForm.skillsCovered} onChange={(e) => setModuleForm({ ...moduleForm, skillsCovered: e.target.value })} />
                                    </div>
                                    <div className="col-md-4 form-group">
                                        <label>Due Date</label>
                                        <input type="date" className="form-control" value={moduleForm.dueDate} onChange={(e) => setModuleForm({ ...moduleForm, dueDate: e.target.value })} />
                                    </div>
                                    <div className="col-md-12 form-group">
                                        <label>Assign Employees *</label>
                                        <select
                                            multiple
                                            className="form-control"
                                            value={moduleForm.assignedEmployees}
                                            onChange={(e) => {
                                                const values = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                                                setModuleForm({ ...moduleForm, assignedEmployees: values });
                                            }}
                                            style={{ minHeight: 120 }}
                                        >
                                            {employees.map((emp) => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.firstname} {emp.lastname} (ID: {emp.id})
                                                </option>
                                            ))}
                                        </select>
                                        <small className="text-muted">Hold Ctrl/Cmd to select multiple employees.</small>
                                    </div>
                                    <div className="col-md-12 form-group mb-0">
                                        <div className="custom-control custom-switch">
                                            <input
                                                type="checkbox"
                                                className="custom-control-input"
                                                id="mandatoryTrainingSwitch"
                                                checked={moduleForm.mandatory}
                                                onChange={(e) => setModuleForm({ ...moduleForm, mandatory: e.target.checked })}
                                            />
                                            <label className="custom-control-label" htmlFor="mandatoryTrainingSwitch">Mandatory Training</label>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn btn-primary mt-3" type="submit">
                                    <FontAwesomeIcon icon={faPlus} className="mr-1" />
                                    Assign Module
                                </button>
                            </form>
                            <hr />
                            <h6 className="mb-2">
                                <FontAwesomeIcon icon={faPlayCircle} className="mr-2 text-danger" />
                                Recommended Video Lessons ({moduleForm.category})
                            </h6>
                            <div className="list-group">
                                {(CATEGORY_VIDEO_LIBRARY[moduleForm.category] || []).map((v, idx) => (
                                    <button
                                        key={`${v.url}-${idx}`}
                                        type="button"
                                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                        onClick={() => {
                                            setModuleForm({ ...moduleForm, videoLessonUrl: v.url });
                                            setVideoSearchTerm(v.title);
                                            setShowVideoSuggestions(false);
                                        }}
                                    >
                                        <span>{v.title}</span>
                                        <small className="text-muted">{v.source}</small>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-5 mb-3">
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="card-header bg-white border-0">
                            <h6 className="mb-0"><FontAwesomeIcon icon={faChartBar} className="mr-2 text-danger" />Skill Gap Snapshot</h6>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-sm mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Employee</th>
                                            <th>Required</th>
                                            <th>Gap</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {skillGapRows.slice(0, 8).map((r) => (
                                            <tr key={r.employeeId}>
                                                <td>{r.employeeName || `Emp #${r.employeeId}`}</td>
                                                <td>{r.requiredCount}</td>
                                                <td>
                                                    <span className={`badge ${r.gapCount > 0 ? "badge-danger" : "badge-success"}`}>
                                                        {r.gapCount}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0">
                            <h6 className="mb-0"><FontAwesomeIcon icon={faCertificate} className="mr-2 text-warning" />Record Certification</h6>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleAddCertification}>
                                <div className="form-group">
                                    <label>Employee *</label>
                                    <select className="form-control" value={certForm.employeeId} onChange={(e) => setCertForm({ ...certForm, employeeId: e.target.value })}>
                                        <option value="">Select Employee</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>{emp.firstname} {emp.lastname}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Certificate *</label>
                                    <input className="form-control" value={certForm.certificateName} onChange={(e) => setCertForm({ ...certForm, certificateName: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Issuer *</label>
                                    <input className="form-control" value={certForm.issuer} onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <div className="col form-group">
                                        <label>Issue Date</label>
                                        <input type="date" className="form-control" value={certForm.issueDate} onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })} />
                                    </div>
                                    <div className="col form-group">
                                        <label>Expiry Date</label>
                                        <input type="date" className="form-control" value={certForm.expiryDate} onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })} />
                                    </div>
                                </div>
                                <button className="btn btn-outline-primary btn-sm" type="submit">
                                    <FontAwesomeIcon icon={faPlus} className="mr-1" />
                                    Add Certification
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-lg-6 mb-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0">
                            <h6 className="mb-0"><FontAwesomeIcon icon={faBook} className="mr-2 text-info" />Training Modules</h6>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-sm mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Mandatory</th>
                                            <th>Lesson</th>
                                            <th>Assigned</th>
                                            <th>Completed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modules.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-3 text-muted">No modules assigned yet</td></tr>
                                        ) : (
                                            modules.map((m) => {
                                                const assignedCount = (m.assignees || []).length;
                                                const completedCount = (m.assignees || []).filter((a) => a.status === "COMPLETED").length;
                                                return (
                                                    <tr key={m.id}>
                                                        <td>{m.title}</td>
                                                        <td>{m.category}</td>
                                                        <td>{m.mandatory ? <span className="badge badge-danger">Yes</span> : <span className="badge badge-secondary">No</span>}</td>
                                                        <td>
                                                            {m.videoLessonUrl ? (
                                                                <a href={m.videoLessonUrl} target="_blank" rel="noreferrer">
                                                                    <FontAwesomeIcon icon={faPlayCircle} className="mr-1 text-danger" />
                                                                    Watch
                                                                </a>
                                                            ) : "-"}
                                                        </td>
                                                        <td>{assignedCount}</td>
                                                        <td>{completedCount}</td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-6 mb-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0">
                            <h6 className="mb-0"><FontAwesomeIcon icon={faGraduationCap} className="mr-2 text-success" />Employee Skills</h6>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleAddSkill}>
                                <div className="form-row">
                                    <div className="col-md-4 form-group">
                                        <label>Employee *</label>
                                        <select className="form-control" value={skillForm.employeeId} onChange={(e) => setSkillForm({ ...skillForm, employeeId: e.target.value })}>
                                            <option value="">Select</option>
                                            {employees.map((emp) => (
                                                <option key={emp.id} value={emp.id}>{emp.firstname} {emp.lastname}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-4 form-group">
                                        <label>Skill *</label>
                                        <input className="form-control" value={skillForm.skillName} onChange={(e) => setSkillForm({ ...skillForm, skillName: e.target.value })} />
                                    </div>
                                    <div className="col-md-4 form-group">
                                        <label>Level</label>
                                        <select className="form-control" value={skillForm.level} onChange={(e) => setSkillForm({ ...skillForm, level: e.target.value })}>
                                            <option>Beginner</option>
                                            <option>Intermediate</option>
                                            <option>Advanced</option>
                                            <option>Expert</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="col-md-4 form-group">
                                        <label>Last Assessed</label>
                                        <input type="date" className="form-control" value={skillForm.lastAssessed} onChange={(e) => setSkillForm({ ...skillForm, lastAssessed: e.target.value })} />
                                    </div>
                                    <div className="col-md-8 form-group d-flex align-items-end">
                                        <button className="btn btn-outline-success btn-sm" type="submit">
                                            <FontAwesomeIcon icon={faPlus} className="mr-1" />
                                            Add Skill
                                        </button>
                                    </div>
                                </div>
                            </form>
                            <div className="table-responsive">
                                <table className="table table-sm mb-0">
                                    <thead className="thead-light">
                                        <tr>
                                            <th>Employee</th>
                                            <th>Skill</th>
                                            <th>Level</th>
                                            <th>Assessed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {skills.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-2 text-muted">No skill records yet</td></tr>
                                        ) : (
                                            skills.slice(0, 12).map((s) => (
                                                <tr key={s.id}>
                                                    <td>{getEmployeeName(s.employeeId)}</td>
                                                    <td>{s.skillName}</td>
                                                    <td>{s.level}</td>
                                                    <td>{s.lastAssessed || "-"}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainingSkillTracker;
