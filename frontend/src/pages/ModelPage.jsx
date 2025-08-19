import React, { useState, useEffect, useRef } from 'react';
import './ModelPage.css';

export default function ModelPage() {
	const [file, setFile] = useState(null);
	const [preview, setPreview] = useState(null);
	const [service, setService] = useState('xray');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [predictions, setPredictions] = useState(null);
	const [recordId, setRecordId] = useState(null);
	const [confidence, setConfidence] = useState(null);
	const [progress, setProgress] = useState(0);
	const [patientId, setPatientId] = useState('');
	const [recentIds, setRecentIds] = useState([]);
	const [isDragActive, setIsDragActive] = useState(false);

	const handleFileChange = (e) => {
		const f = e.target.files && e.target.files[0];
		if (!f) return;
		if (!validateFile(f)) return;
		setPredictions(null);
		setRecordId(null);
		setConfidence(null);
		setProgress(0);
		setMessage('');
		setFile(f);
		const reader = new FileReader();
		reader.onload = (ev) => setPreview(ev.target.result);
		reader.readAsDataURL(f);
	};

	const fileInputRef = useRef(null);

	const validateFile = (f) => {
		const maxSize = 10 * 1024 * 1024; // 10MB
		const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/bmp', 'image/webp'];
		if (!allowed.includes(f.type)) {
			setMessage('Unsupported file type. Use JPG/PNG/BMP/WEBP.');
			return false;
		}
		if (f.size > maxSize) {
			setMessage('File too large. Max 10MB allowed.');
			return false;
		}
		return true;
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		setIsDragActive(true);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setIsDragActive(false);
		const f = e.dataTransfer.files && e.dataTransfer.files[0];
		if (!f) return;
		if (!validateFile(f)) return;
		// clear previous results when user drops a new file
		setPredictions(null);
		setRecordId(null);
		setConfidence(null);
		setProgress(0);
		setMessage('');
		setFile(f);
		const reader = new FileReader();
		reader.onload = (ev) => setPreview(ev.target.result);
		reader.readAsDataURL(f);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!file) {
			setMessage('Please select an image before submitting.');
			return;
		}

		setLoading(true);
		setMessage('');
		setPredictions(null);

		try {
			const form = new FormData();
			form.append('file', file);
			if (patientId) form.append('userId', patientId);

			const base = process.env.REACT_APP_MODEL_API || 'http://127.0.0.1:8000';
			const endpoint = service === 'mri' ? '/api/predictions/upload/mri' : '/api/predictions/upload/x-ray';
			const url = `${base}${endpoint}`;

			// Use XHR to get upload progress
			const uploadWithProgress = (url, formData) => {
				return new Promise((resolve, reject) => {
					const xhr = new XMLHttpRequest();
					xhr.open('POST', url);
					xhr.onreadystatechange = () => {
						if (xhr.readyState === 4) {
							if (xhr.status >= 200 && xhr.status < 300) {
								try {
									const json = JSON.parse(xhr.responseText);
									resolve(json);
								} catch (err) {
									reject(new Error('Invalid JSON response'));
								}
							} else {
								reject(new Error(`Server responded ${xhr.status}: ${xhr.responseText}`));
							}
						}
					};
					xhr.upload.onprogress = (evt) => {
						if (evt.lengthComputable) {
							const pct = Math.round((evt.loaded / evt.total) * 100);
							setProgress(pct);
						}
					};
					xhr.onerror = () => reject(new Error('Network error during upload'));
					xhr.send(formData);
				});
			};

			const data = await uploadWithProgress(url, form);
			setPredictions(data.predictions || data);
			setRecordId(data.id || data.ID || null);
			setConfidence(data.confidence ?? null);
			setMessage('Prediction received');
			setProgress(100);
			// store recent id
			if (data.id) {
				const next = [data.id, ...recentIds.filter((i) => i !== data.id)].slice(0, 8);
				setRecentIds(next);
				localStorage.setItem('ayu_recent_ids', JSON.stringify(next));
			}
		} catch (err) {
			console.error('Upload error', err);
			setMessage(`Upload failed: ${err.message}`);
			setProgress(0);
		} finally {
			setLoading(false);
		}
	};

	const clearSelection = () => {
		// clear file + all result state so user can start fresh
		setFile(null);
		setPreview(null);
		setMessage('');
		setPredictions(null);
		setRecordId(null);
		setConfidence(null);
		setProgress(0);
	};

	useEffect(() => {
		try {
			const raw = localStorage.getItem('ayu_recent_ids');
			if (raw) setRecentIds(JSON.parse(raw));
		} catch {
			// ignore
		}
	}, []);

	const fetchPrevious = async (id) => {
		if (!id) return;
		setLoading(true);
		setMessage('Fetching previous result...');
		try {
			const base = process.env.REACT_APP_MODEL_API || 'http://127.0.0.1:8000';
			const res = await fetch(`${base}/api/predictions/result/${id}`);
			if (!res.ok) throw new Error(`Server ${res.status}`);
			const data = await res.json();
			setPredictions(data.result || data.predictions || data.result || data);
			setRecordId(data.id || id);
			setConfidence(data.confidence ?? null);
			setMessage('Fetched previous result');
		} catch (err) {
			setMessage(`Fetch failed: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	// Render a formatted diagnostic report
	const renderReport = () => {
		if (!predictions) return null;
		return (
			<div className="diagnostic-report">
				<div className="report-header">
					<div><strong>Record ID:</strong> {recordId}</div>
					{confidence !== null && <div><strong>Confidence:</strong> {confidence}</div>}
				</div>
				{Object.entries(predictions).map(([k, v]) => (
					<div className="report-block" key={k}>
						<div className="report-title">{k.toUpperCase()}</div>
						{v.label && <div className="report-label">Label: <strong>{v.label}</strong></div>}
						{v.class_index !== undefined && <div>Class index: {v.class_index}</div>}
						{v.value !== undefined && <div>Value: {v.value}</div>}
						{v.probabilities && (
							<div className="probs">
								{v.probabilities.map((p, idx) => (
									<div key={idx} className="prob-row">
										<div className="prob-label">{idx}</div>
										<div className="prob-bar"><div className="prob-fill" style={{width:`${Math.round(p*100)}%`}}></div></div>
										<div className="prob-val">{p.toFixed(4)}</div>
									</div>
								))}
							</div>
						)}
					</div>
				))}
			</div>
		);
	};

	const generateSummary = () => {
		if (!predictions) return '';
		const parts = [];
		let diseaseInfo = '';
		
		// MRI summary
		if (predictions.mri) {
			const m = predictions.mri;
			if (m.label) {
				parts.push(`MRI result: ${m.label} (confidence ${((m.probabilities && Math.max(...m.probabilities)) || confidence || 0).toFixed(2)})`);
				diseaseInfo += getDiseaseInfo('mri', m.label);
			} else if (m.class_index !== undefined) {
				parts.push(`MRI class index: ${m.class_index}`);
			}
		}

		if (predictions.xray) {
			const x = predictions.xray;
			if (x.label) {
				parts.push(`X-ray result: ${x.label} (value ${x.value !== undefined ? x.value.toFixed(2) : 'N/A'})`);
				diseaseInfo += getDiseaseInfo('xray', x.label);
			} else if (x.value !== undefined) {
				parts.push(`X-ray numeric result: ${x.value.toFixed(2)}`);
			}
		}

		return parts.join('. ') + diseaseInfo;
	};

	const getDiseaseInfo = (type, label) => {
		const diseaseDatabase = {
			mri: {
				'glioma': {
					name: 'Glioma Tumor',
					description: 'A type of brain tumor that originates in glial cells. Gliomas are the most common primary brain tumors.',
					symptoms: 'Headaches, seizures, memory problems, personality changes, nausea, and neurological deficits.',
					treatment: 'Treatment typically involves surgery, radiation therapy, and chemotherapy. Early detection improves treatment outcomes.',
					urgency: 'Requires immediate medical attention and specialized oncological care.'
				},
				'meningioma': {
					name: 'Meningioma Tumor',
					description: 'A tumor that arises from the meninges, the membranes surrounding the brain and spinal cord. Usually benign.',
					symptoms: 'Headaches, seizures, vision problems, hearing loss, and weakness in arms or legs.',
					treatment: 'Treatment options include observation, surgery, or radiation therapy depending on size and location.',
					urgency: 'Requires medical evaluation, but many are slow-growing and may only need monitoring.'
				},
				'notumor': {
					name: 'No Tumor Detected',
					description: 'No signs of brain tumor detected in the MRI scan.',
					symptoms: 'N/A - No tumor detected.',
					treatment: 'No treatment needed for tumor. If symptoms persist, consult with healthcare provider for other possible causes.',
					urgency: 'Regular health monitoring recommended.'
				},
				'pituitary': {
					name: 'Pituitary Tumor',
					description: 'A growth in the pituitary gland, which controls hormone production. Most are non-cancerous.',
					symptoms: 'Vision problems, hormonal imbalances, headaches, and fatigue.',
					treatment: 'Treatment may include medication, surgery, or radiation therapy depending on type and symptoms.',
					urgency: 'Requires endocrinological evaluation and specialized care.'
				}
			},
			xray: {
				'normal': {
					name: 'Normal Chest X-ray',
					description: 'No signs of pneumonia or other lung abnormalities detected.',
					symptoms: 'N/A - Normal chest X-ray.',
					treatment: 'No treatment needed. Maintain good respiratory health practices.',
					urgency: 'Routine follow-up as recommended by healthcare provider.'
				},
				'pneumonia': {
					name: 'Pneumonia',
					description: 'An infection that inflames air sacs in one or both lungs, which may fill with fluid.',
					symptoms: 'Cough with phlegm, fever, chills, shortness of breath, chest pain, and fatigue.',
					treatment: 'Antibiotics for bacterial pneumonia, rest, fluids, and fever reducers. Hospitalization may be needed in severe cases.',
					urgency: 'Requires immediate medical attention, especially in elderly, young children, or immunocompromised patients.'
				}
			}
		};

		const condition = diseaseDatabase[type]?.[label.toLowerCase().replace(/\s+/g, '_')];
		if (!condition) return '';

		return `\n\n📋 Medical Information about ${condition.name}:\n` +
			   `🔍 Description: ${condition.description}\n` +
			   `⚕️ Common Symptoms: ${condition.symptoms}\n` +
			   `💊 Recommended Treatment: ${condition.treatment}\n` +
			   `⚠️ Medical Urgency: ${condition.urgency}\n\n` +
			   `⚠️ IMPORTANT DISCLAIMER: This is an AI-generated analysis for informational purposes only. Always consult with qualified healthcare professionals for proper diagnosis and treatment decisions.`;
	};

	return (
		<div className="model-page dark-page">
			<header className="page-header">
				<div className="logo">Ayu-Rakshak</div>
				<div className="top-actions">
					<button className="ghost-btn">Start Diagnosis</button>
					<button className="primary-btn">Upload Image</button>
				</div>
			</header>

			<div className="model-card dark">
				<h2 className="card-title">Choose a service</h2>

				<form onSubmit={handleSubmit} className="model-form">
					{/* hidden file input to allow programmatic re-open */}
					<input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{display:'none'}} />
					<div className="services-grid">
						<div className={`service-card ${service === 'mri' ? 'selected' : ''}`} onClick={() => setService('mri')}>
							<div className="service-icon bg-purple"></div>
							<div className="service-body">
								<div className="service-label">MRI</div>
								<div className="service-desc">MRI scans can detect Pituitary,Meningioma,Glioma and No Tumor.</div>
								<div className="service-sub">Click to select</div>
							</div>
							{service === 'mri' && <div className="selected-badge">Selected</div>}
						</div>

						<div className={`service-card ${service === 'xray' ? 'selected' : ''}`} onClick={() => setService('xray')}>
							<div className="service-icon bg-orange"></div>
							<div className="service-body">
								<div className="service-label">X-Ray</div>
								<div className="service-desc">x-ray scan can detect Pneumonia (bacterial, viral, or fungal) and Normal</div>
								<div className="service-sub">Click to select</div>
							</div>
							{service === 'xray' && <div className="selected-badge">Selected</div>}
						</div>
					</div>

					<div className={`drop-area big ${isDragActive ? 'active' : ''}`} onDragOver={handleDragOver} onDragLeave={() => setIsDragActive(false)} onDrop={handleDrop}>
						{preview ? (
							<img src={preview} alt="preview" className="preview-image-large" />
						) : (
							<div className="drop-center">
								<label className="upload-btn">
									<input type="file" accept="image/*" onChange={handleFileChange} hidden />
									⬆️
								</label>
							</div>
						)}
					</div>

					<div className="inline-row">
						<label className="small-label">Patient ID</label>
						<input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Optional patient id" className="input-small" />
					</div>

					{message && <div className="message">{message}</div>}

					{progress > 0 && progress < 100 && (
						<div className="progress-wrap">
							<div className="progress-bar" style={{width: `${progress}%`}} />
							<div className="progress-label">{progress}%</div>
						</div>
					)}

					{recordId && (
						<div className="result-card">
							{renderReport()}
							{predictions && (
								<div className="report-summary">{generateSummary()}</div>
							)}
						</div>
					)}

					<div className="actions">
						<button type="button" className="secondary-btn" onClick={() => { clearSelection(); fileInputRef.current && fileInputRef.current.click(); }}>
							Upload New Image
						</button>
						<button type="submit" className="submit-btn" disabled={loading}>
							{loading ? 'Submitting...' : 'Start Diagnosis'}
						</button>
					</div>

					{recentIds.length > 0 && (
						<div className="recent-list">
							<h4>Recent Predictions</h4>
							<ul>
								{recentIds.map((id) => (
									<li key={id}>
										<span className="recent-id">{id}</span>
										<button type="button" onClick={() => fetchPrevious(id)} className="small-btn">Load</button>
									</li>
								))}
							</ul>
						</div>
					)}
				</form>
			</div>
		</div>
	);
}

