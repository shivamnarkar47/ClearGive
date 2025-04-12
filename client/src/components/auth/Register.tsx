import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { toast } from 'sonner';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'CHARITY_OWNER'>('USER');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password, role);
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to register: ' + (error as Error).message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-card rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Account Type</Label>
          <RadioGroup value={role} onValueChange={(value: 'USER' | 'CHARITY_OWNER') => setRole(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="USER" id="user" />
              <Label htmlFor="user">Regular User</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CHARITY_OWNER" id="charity-owner" />
              <Label htmlFor="charity-owner">Charity Owner</Label>
            </div>
          </RadioGroup>
        </div>
        <Button type="submit" className="w-full">Register</Button>
      </form>
    </div>
  );
} 