import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

const RatingModal = ({ isOpen, onClose, onSubmit, providerName }) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) return;

        setLoading(true);
        try {
            await onSubmit({ rating, review });
            setRating(0);
            setReview('');
            onClose();
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-bold text-lg">Rate Your Experience</h3>
                        <p className="text-white/70 text-xs mt-1">with {providerName}</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white p-1">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Star Rating */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="transition-transform hover:scale-110"
                            >
                                <Star
                                    size={40}
                                    className={`${star <= (hoveredRating || rating)
                                            ? 'text-amber-400 fill-amber-400'
                                            : 'text-gray-300'
                                        } transition-colors`}
                                />
                            </button>
                        ))}
                    </div>

                    <p className="text-center text-sm font-medium text-gray-500">
                        {rating === 0 ? 'Tap to rate' :
                            rating === 1 ? 'Poor' :
                                rating === 2 ? 'Fair' :
                                    rating === 3 ? 'Good' :
                                        rating === 4 ? 'Very Good' : 'Excellent!'}
                    </p>

                    {/* Review Text */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Review (Optional)
                        </label>
                        <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Share your experience..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition h-24 resize-none"
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 p-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition"
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={rating === 0 || loading}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Rating'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;
