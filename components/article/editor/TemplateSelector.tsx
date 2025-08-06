import styles from "../article.module.scss";

interface TemplateSelectorProps {
  template: string;
  onChange: (t: string) => void;
}

export default function TemplateSelector({ template, onChange }: TemplateSelectorProps) {
  return (
    <div className={styles.templateSelector}>
              <div className=" flex flex-col">

      {[
        { key: "standard", label: "Standard" },
        { key: "feature", label: "Feature" },
        { key: "interview", label: "Interview" },
      ].map((t) => (
        <div className=" flex flex-col">

        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={template === t.key ? styles.active : ""}
        >
          {t.label}
        </button>
        </div>

      ))}
      </div>
    </div>
  );
}
