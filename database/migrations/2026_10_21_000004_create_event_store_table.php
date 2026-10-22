<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_store', function (Blueprint $table) {
            $table->id();
            $table->string('event_id', 100)->unique();
            $table->string('aggregate_type', 100);
            $table->string('aggregate_id', 100);
            $table->string('event_type', 100);
            $table->unsignedInteger('version');
            $table->json('payload');
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['aggregate_type', 'aggregate_id', 'version']);
            $table->index(['aggregate_type', 'aggregate_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_store');
    }
};
