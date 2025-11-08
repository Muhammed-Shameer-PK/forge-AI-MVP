import React from 'react';
import { FounderProfile, FundingStage } from '../types';

interface FounderProfileFormProps {
  profile: FounderProfile;
  setProfile: React.Dispatch<React.SetStateAction<FounderProfile>>;
  disabled: boolean;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-400 mb-1">{children}</label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`w-full p-2 bg-white/5 dark:bg-[#1e1f20]/50 border border-white/10 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary-brand)] transition-all duration-300 ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`} />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`w-full p-2 bg-white/5 dark:bg-[#1e1f20]/50 border border-white/10 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary-brand)] transition-all duration-300 ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`} />
);


const FounderProfileForm: React.FC<FounderProfileFormProps> = ({ profile, setProfile, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number | string[] = value;

    if (name === 'experience_years' || name === 'team_size' || name === 'runway_months') {
      processedValue = parseInt(value, 10) || 0;
    } else if (name === 'tech_stack') {
      processedValue = value.split(',').map(s => s.trim()).filter(Boolean);
    }

    setProfile(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const fundingStages: FundingStage[] = ["pre-seed", "seed", "pre-series-a", "series-a+"];

  return (
    <div className="bg-white/5 dark:bg-[#1e1f20]/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Founder Profile</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="experience_years">Experience (Years)</Label>
          <Input type="number" name="experience_years" id="experience_years" value={profile.experience_years} onChange={handleChange} disabled={disabled} min="0" />
        </div>
        <div>
          <Label htmlFor="team_size">Team Size</Label>
          <Input type="number" name="team_size" id="team_size" value={profile.team_size} onChange={handleChange} disabled={disabled} min="1" />
        </div>
        <div>
          <Label htmlFor="runway_months">Runway (Months)</Label>
          <Input type="number" name="runway_months" id="runway_months" value={profile.runway_months} onChange={handleChange} disabled={disabled} min="0" />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="tech_stack">Tech Stack (comma-separated)</Label>
          <Input type="text" name="tech_stack" id="tech_stack" value={profile.tech_stack.join(', ')} onChange={handleChange} disabled={disabled} placeholder="e.g., React, Python" />
        </div>
         <div>
          <Label htmlFor="funding_stage">Funding Stage</Label>
          <Select name="funding_stage" id="funding_stage" value={profile.funding_stage} onChange={handleChange} disabled={disabled}>
             {fundingStages.map(stage => <option key={stage} value={stage}>{stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </Select>
        </div>
        <div className="md:col-span-3">
          <Label htmlFor="location">Location</Label>
          <Input type="text" name="location" id="location" value={profile.location} onChange={handleChange} disabled={disabled} placeholder="e.g., Bangalore, India" />
        </div>
      </div>
    </div>
  );
};

export default FounderProfileForm;
