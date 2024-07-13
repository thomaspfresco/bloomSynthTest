import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function NoPage() {

    const navigate = useNavigate();

    useEffect(() => { navigate("/") }, [navigate]);

    return (
        <div className="noPage">
        </div>
    )
}

export default NoPage;