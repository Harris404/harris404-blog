import './About.css';

export default function About() {
  return (
    <div className="about-page">
      <div className="about-content">
        <h1>About</h1>

        <div className="about-bio">
          <p>
            Hi, I'm <strong>Paris</strong> — an AI researcher and developer passionate about 
            understanding and building with Large Language Models.
          </p>
          <p>
            This blog is my personal space for sharing deep dives into LLM architectures, 
            paper breakdowns, and practical code implementations. I believe the best way to 
            truly understand something is to write about it.
          </p>
          <p>
            Each post here represents part of my journey — from the mathematical foundations 
            of attention mechanisms to real-world production systems built on top of these models.
          </p>
        </div>

        <section className="about-section">
          <h3>Research Interests</h3>
          <ul className="about-interests">
            <li>Large Language Models & Transformer Architectures</li>
            <li>RLHF & AI Alignment</li>
            <li>Retrieval-Augmented Generation</li>
            <li>Efficient Inference & Quantization</li>
            <li>Multimodal AI Systems</li>
          </ul>
        </section>

        <section className="about-section">
          <h3>Connect</h3>
          <div className="about-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub →</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter / X →</a>
            <a href="mailto:harris@example.com">Email →</a>
          </div>
        </section>
      </div>
    </div>
  );
}
